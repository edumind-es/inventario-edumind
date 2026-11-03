/**
 * Base de datos — Inventario EDUmind
 * =====================================================================
 * SQLite con el módulo nativo de Node (`node:sqlite`). Un único fichero
 * `inventario.db` en la zona de datos del sistema, FUERA de la carpeta de
 * la app, para que sobreviva a las actualizaciones (basta sustituir la
 * carpeta de la aplicación).
 *
 * `scripts/paths.mjs` y `scripts/admin.mjs` replican `defaultDataDir()`:
 * si se cambia aquí hay que cambiarlo allí.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync, copyFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

function defaultDataDir(): string {
	const home = homedir();
	if (process.platform === 'win32')
		return join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'InventarioEDUmind');
	if (process.platform === 'darwin')
		return join(home, 'Library', 'Application Support', 'InventarioEDUmind');
	return join(process.env.XDG_DATA_HOME ?? join(home, '.local', 'share'), 'inventario-edumind');
}

const DB_PATH = process.env.EDUMIND_DB_PATH ?? join(defaultDataDir(), 'inventario.db');
export const DATA_DIR = dirname(DB_PATH);
// scripts/server.mjs lee esta variable para guardar el certificado y url.txt.
process.env.EDUMIND_DATA_DIR = DATA_DIR;

// Una sola conexión por proceso aunque Vite recargue el módulo en desarrollo.
const globalForDb = globalThis as unknown as { __edumindDb?: DatabaseSync };

/** Versiones anteriores guardaban en ./data: se importa una vez si existe. */
function importLegacyIfNeeded() {
	if (existsSync(DB_PATH)) return;
	const legacy = resolve('data', 'inventario.db');
	if (existsSync(legacy) && resolve(legacy) !== resolve(DB_PATH)) {
		copyFileSync(legacy, DB_PATH);
		for (const suf of ['-wal', '-shm']) {
			if (existsSync(legacy + suf)) copyFileSync(legacy + suf, DB_PATH + suf);
		}
	}
}

function createConnection(): DatabaseSync {
	mkdirSync(DATA_DIR, { recursive: true });
	importLegacyIfNeeded();
	const database = new DatabaseSync(DB_PATH);
	database.exec('PRAGMA journal_mode = WAL;');
	database.exec('PRAGMA foreign_keys = ON;');
	migrate(database);
	seed(database);
	return database;
}

export const db: DatabaseSync = globalForDb.__edumindDb ?? createConnection();
if (!globalForDb.__edumindDb) globalForDb.__edumindDb = db;

/* ------------------------------ Migraciones ------------------------------ */
function migrate(d: DatabaseSync) {
	const row = d.prepare('PRAGMA user_version').get() as { user_version?: number } | undefined;
	let version = row?.user_version ?? 0;
	const setVersion = (n: number) => {
		d.exec(`PRAGMA user_version = ${n}`);
		version = n;
	};

	if (version < 1) {
		d.exec(`
		CREATE TABLE IF NOT EXISTS categories (
			id         INTEGER PRIMARY KEY,
			code       TEXT NOT NULL UNIQUE,
			name       TEXT NOT NULL,
			color      TEXT NOT NULL DEFAULT '#0f766e',
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS users (
			id            INTEGER PRIMARY KEY,
			name          TEXT NOT NULL,
			email         TEXT UNIQUE,
			identifier    TEXT,
			role          TEXT NOT NULL DEFAULT 'consulta',
			password_hash TEXT,
			can_borrow    INTEGER NOT NULL DEFAULT 1,
			active        INTEGER NOT NULL DEFAULT 1,
			created_at    TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS devices (
			id          INTEGER PRIMARY KEY,
			code        TEXT NOT NULL UNIQUE,
			category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
			name        TEXT,
			brand       TEXT,
			model       TEXT,
			serial      TEXT,
			location    TEXT,
			status      TEXT NOT NULL DEFAULT 'disponible',
			notes       TEXT,
			created_at  TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS loans (
			id             INTEGER PRIMARY KEY,
			device_id      INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
			user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
			borrower_name  TEXT,
			checked_out_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
			checkout_at    TEXT NOT NULL DEFAULT (datetime('now')),
			due_at         TEXT,
			returned_at    TEXT,
			returned_to    INTEGER REFERENCES users(id) ON DELETE SET NULL,
			notes          TEXT
		);

		CREATE TABLE IF NOT EXISTS sessions (
			token      TEXT PRIMARY KEY,
			user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			expires_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS settings (
			key   TEXT PRIMARY KEY,
			value TEXT
		);

		CREATE INDEX IF NOT EXISTS idx_loans_device   ON loans(device_id);
		CREATE INDEX IF NOT EXISTS idx_loans_active   ON loans(returned_at);
		CREATE INDEX IF NOT EXISTS idx_loans_user     ON loans(user_id);
		CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
		CREATE INDEX IF NOT EXISTS idx_devices_cat    ON devices(category_id);
		`);
		setVersion(1);
	}
}

/* --------------------------- Datos por defecto --------------------------- */
function seed(d: DatabaseSync) {
	const catCount = d.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number };
	if (catCount.n === 0) {
		const insert = d.prepare('INSERT INTO categories (code, name, color) VALUES (?, ?, ?)');
		const defaults: [string, string, string][] = [
			['POR', 'Portátil', '#0f766e'],
			['TAB', 'Tablet', '#7c3aed'],
			['SOB', 'Ordenador de sobremesa', '#1d4ed8'],
			['PRO', 'Proyector', '#c2410c'],
			['MON', 'Monitor', '#0891b2'],
			['PDI', 'Pizarra digital', '#be123c'],
			['IMP', 'Impresora', '#4d7c0f'],
			['ROB', 'Robótica', '#a16207'],
			['PER', 'Periférico', '#475569'],
			['OTR', 'Otros', '#64748b']
		];
		for (const c of defaults) insert.run(...c);
	}

	const settingsDefaults: [string, string][] = [
		['center_name', 'Centro Educativo'],
		['center_code', ''],
		['loan_default_days', '7'],
		['label_offset_x_mm', '0'],
		['label_offset_y_mm', '0'],
		['center_logo', ''],
		[
			'lopd_text',
			'En cumplimiento del RGPD (UE) 2016/679 y la LOPDGDD 3/2018, le informamos de que los datos personales recogidos en este documento serán tratados por el centro con la única finalidad de gestionar y dejar constancia del préstamo de equipamiento. La base jurídica es el cumplimiento de una misión realizada en interés público. Los datos se conservarán durante el tiempo necesario para dicha finalidad y no se cederán a terceros salvo obligación legal. Puede ejercer sus derechos de acceso, rectificación, supresión, oposición y limitación dirigiéndose a la dirección del centro.'
		]
	];
	const upsertSetting = d.prepare(
		'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING'
	);
	for (const s of settingsDefaults) upsertSetting.run(...s);
}

/* -------------------------------- Ajustes -------------------------------- */
export function getSetting(key: string, fallback = ''): string {
	const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
		| { value: string | null }
		| undefined;
	return row?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
	db.prepare(
		'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
	).run(key, value);
}

/* --------------------------- Copia de seguridad --------------------------- */
/** Copia consistente de la base de datos completa (VACUUM INTO) como Buffer. */
export function backupToBuffer(): Buffer {
	const tmp = join(tmpdir(), `edumind-backup-${Date.now()}.db`);
	db.exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
	const buf = readFileSync(tmp);
	try {
		rmSync(tmp, { force: true });
	} catch {
		/* no crítico */
	}
	return buf;
}
