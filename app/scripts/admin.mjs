/**
 * Herramienta de administración — Inventario EDUmind
 * =====================================================================
 * Crea o restablece una cuenta de ADMINISTRADOR directamente en la base
 * de datos de este ordenador. Es el mecanismo de recuperación cuando
 * nadie recuerda la contraseña (acceso físico al equipo = poder de
 * recuperación, coherente con el modelo local-first).
 *
 * Uso interactivo:
 *     npm run admin
 *
 * Uso directo (no interactivo):
 *     node --experimental-sqlite scripts/admin.mjs --email a@b.c --name "Nombre" --password "min8"
 *
 * Otras acciones:
 *     node --experimental-sqlite scripts/admin.mjs --list      (lista administradores)
 */
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline';

// MISMA ubicación de datos que src/lib/server/db.ts (fuera de la carpeta de la app).
function defaultDataDir() {
	const home = homedir();
	if (process.platform === 'win32')
		return join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'InventarioEDUmind');
	if (process.platform === 'darwin')
		return join(home, 'Library', 'Application Support', 'InventarioEDUmind');
	return join(process.env.XDG_DATA_HOME ?? join(home, '.local', 'share'), 'inventario-edumind');
}

const DB_PATH = process.env.EDUMIND_DB_PATH ?? join(defaultDataDir(), 'inventario.db');

// Importa datos de una instalación antigua (./data) si aún no existen aquí.
if (!existsSync(DB_PATH)) {
	const legacy = resolve('data', 'inventario.db');
	if (existsSync(legacy) && resolve(legacy) !== resolve(DB_PATH)) {
		mkdirSync(dirname(DB_PATH), { recursive: true });
		copyFileSync(legacy, DB_PATH);
	}
}

/* --------- Hash de contraseña: MISMO formato que src/lib/server/auth.ts --------- */
function hashPassword(password) {
	const salt = randomBytes(16);
	const derived = scryptSync(password, salt, 64);
	return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/* ----------------------------- Argumentos ----------------------------- */
function parseArgs(argv) {
	const out = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--list') out.list = true;
		else if (a.startsWith('--')) {
			const key = a.slice(2);
			const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
			out[key] = val;
		}
	}
	return out;
}

/* -------------------------- Entrada por teclado -------------------------- */
function ask(question, { hidden = false } = {}) {
	const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
	return new Promise((resolvePrompt) => {
		if (hidden) {
			rl._writeToOutput = (str) => {
				// Muestra la pregunta; enmascara lo que se teclea.
				if (rl.stdoutMuted && !str.includes(question)) rl.output.write('*');
				else rl.output.write(str);
			};
		}
		rl.question(question, (answer) => {
			rl.close();
			if (hidden) process.stdout.write('\n');
			resolvePrompt(answer.trim());
		});
		if (hidden) rl.stdoutMuted = true;
	});
}

/* ------------------------------ Base de datos ------------------------------ */
function openDb() {
	mkdirSync(dirname(DB_PATH), { recursive: true });
	const db = new DatabaseSync(DB_PATH);
	db.exec('PRAGMA foreign_keys = ON;');
	// Garantiza que la tabla exista aunque la app no se haya arrancado todavía.
	db.exec(`
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
	`);
	return db;
}

function listAdmins(db) {
	const rows = db
		.prepare(
			"SELECT name, email, active FROM users WHERE role = 'admin' ORDER BY name"
		)
		.all();
	if (rows.length === 0) {
		console.log('\nNo hay ningún administrador en la base de datos.');
	} else {
		console.log('\nAdministradores:');
		for (const r of rows) {
			console.log(`  • ${r.name}  <${r.email ?? 'sin correo'}>  ${r.active ? '' : '(inactivo)'}`);
		}
	}
	console.log('');
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	console.log('\n=== Inventario EDUmind · Administración de acceso ===');
	console.log(`Base de datos: ${DB_PATH}\n`);

	const db = openDb();

	if (args.list) {
		listAdmins(db);
		db.close();
		return;
	}

	listAdmins(db);

	// Recoger datos (por argumentos o preguntando)
	let email = (args.email ?? '').toLowerCase();
	if (!email) email = (await ask('Correo del administrador: ')).toLowerCase();
	if (!email) {
		console.error('Se necesita un correo. Cancelado.');
		db.close();
		process.exit(1);
	}

	const existing = db
		.prepare('SELECT id, name FROM users WHERE email = ?')
		.get(email);

	let name = args.name ?? '';
	if (existing) {
		console.log(`\nEl usuario ${email} ya existe (${existing.name}).`);
		console.log('Se restablecerá su contraseña y se asegurará el rol de administrador.');
	} else {
		if (!name) name = await ask('Nombre completo: ');
		if (!name) {
			console.error('Se necesita un nombre para crear el usuario. Cancelado.');
			db.close();
			process.exit(1);
		}
	}

	let password = args.password ?? '';
	if (!password) {
		password = await ask('Contraseña nueva (mín. 8): ', { hidden: true });
		const repeat = await ask('Repite la contraseña: ', { hidden: true });
		if (password !== repeat) {
			console.error('\nLas contraseñas no coinciden. Cancelado.');
			db.close();
			process.exit(1);
		}
	}
	if (password.length < 8) {
		console.error('\nLa contraseña debe tener al menos 8 caracteres. Cancelado.');
		db.close();
		process.exit(1);
	}

	const hash = hashPassword(password);

	if (existing) {
		db.prepare(
			"UPDATE users SET password_hash = ?, role = 'admin', active = 1, updated_at = datetime('now') WHERE id = ?"
		).run(hash, existing.id);
		console.log(`\n✔ Contraseña restablecida. ${email} ya puede iniciar sesión como administrador.`);
	} else {
		db.prepare(
			"INSERT INTO users (name, email, role, password_hash, can_borrow, active) VALUES (?, ?, 'admin', ?, 1, 1)"
		).run(name, email, hash);
		console.log(`\n✔ Administrador creado. Inicia sesión con ${email}.`);
	}

	db.close();
	console.log('');
}

main().catch((err) => {
	console.error('\nError inesperado:', err.message);
	process.exit(1);
});
