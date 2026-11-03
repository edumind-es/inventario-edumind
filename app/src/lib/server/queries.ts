/**
 * Consultas y operaciones sobre equipos, usuarios y préstamos.
 * Toda la lógica de negocio con la base de datos vive aquí; las rutas solo
 * leen el formulario, comprueban permisos y llaman a estas funciones.
 */
import { db } from './db';
import type { Role } from '$lib/roles';

/* -------------------------------- Tipos -------------------------------- */
import type { Category, Device, DeviceStatus, DeviceView, LoanFull, LoanRow, UserRow } from '$lib/types';
export type { Category, Device, DeviceStatus, DeviceView, LoanFull, LoanRow, UserRow } from '$lib/types';

export type DeviceInput = {
	category_id: number | null;
	code: string;
	name: string | null;
	brand: string | null;
	model: string | null;
	serial: string | null;
	location: string | null;
	status: DeviceStatus;
	notes: string | null;
};

export type UserInput = {
	name: string;
	email: string | null;
	identifier: string | null;
	role: Role;
	can_borrow: boolean;
	active: boolean;
};

/* ------------------------------- Equipos ------------------------------- */
const DEVICE_VIEW_SELECT = `
	SELECT d.*,
		c.name  AS category_name,
		c.code  AS category_code,
		c.color AS category_color,
		l.borrower_name AS holder_name,
		l.checkout_at   AS checkout_at,
		l.due_at        AS due_at
	FROM devices d
	LEFT JOIN categories c ON c.id = d.category_id
	LEFT JOIN loans l ON l.device_id = d.id AND l.returned_at IS NULL
`;

export type DeviceFilters = { search?: string; status?: string; categoryId?: number };

export function listDevices(filters: DeviceFilters = {}): DeviceView[] {
	const where: string[] = [];
	const params: (string | number)[] = [];
	if (filters.search) {
		where.push('(d.code LIKE ? OR d.name LIKE ? OR d.brand LIKE ? OR d.model LIKE ? OR d.serial LIKE ?)');
		const q = `%${filters.search}%`;
		params.push(q, q, q, q, q);
	}
	if (filters.status) {
		where.push('d.status = ?');
		params.push(filters.status);
	}
	if (filters.categoryId) {
		where.push('d.category_id = ?');
		params.push(filters.categoryId);
	}
	const sql =
		DEVICE_VIEW_SELECT +
		(where.length ? ` WHERE ${where.join(' AND ')}` : '') +
		' ORDER BY d.code ASC';
	return db.prepare(sql).all(...params) as DeviceView[];
}

export function getDeviceView(id: number): DeviceView | null {
	return (db.prepare(DEVICE_VIEW_SELECT + ' WHERE d.id = ?').get(id) as DeviceView | undefined) ?? null;
}

export function getDeviceByCode(code: string): DeviceView | null {
	return (
		(db.prepare(DEVICE_VIEW_SELECT + ' WHERE d.code = ? COLLATE NOCASE').get(code) as
			| DeviceView
			| undefined) ?? null
	);
}

export function listCategories(): Category[] {
	return db.prepare('SELECT id, code, name, color FROM categories ORDER BY name').all() as Category[];
}

export function getCategory(id: number): Category | null {
	return (
		(db.prepare('SELECT id, code, name, color FROM categories WHERE id = ?').get(id) as
			| Category
			| undefined) ?? null
	);
}

export function deviceHistory(deviceId: number): LoanRow[] {
	return db
		.prepare(
			`SELECT l.id, l.device_id, d.code AS device_code, d.name AS device_name,
					c.name AS category_name, l.borrower_name, l.user_id, l.checkout_at,
					l.due_at, l.returned_at, l.notes, op.name AS checked_out_by_name
			 FROM loans l
			 JOIN devices d ON d.id = l.device_id
			 LEFT JOIN categories c ON c.id = d.category_id
			 LEFT JOIN users op ON op.id = l.checked_out_by
			 WHERE l.device_id = ?
			 ORDER BY l.checkout_at DESC`
		)
		.all(deviceId) as LoanRow[];
}

/** Siguiente código libre para la categoría: PREFIJO-0001, 0002… */
export function nextDeviceCode(categoryCode: string): string {
	const prefix = categoryCode.toUpperCase();
	const rows = db
		.prepare('SELECT code FROM devices WHERE code LIKE ? ORDER BY code')
		.all(`${prefix}-%`) as { code: string }[];
	let max = 0;
	for (const r of rows) {
		const m = r.code.match(/-(\d+)$/);
		if (m) max = Math.max(max, parseInt(m[1], 10));
	}
	return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

export function readDeviceForm(form: FormData): DeviceInput {
	const str = (k: string) => {
		const v = String(form.get(k) ?? '').trim();
		return v || null;
	};
	const catRaw = String(form.get('category_id') ?? '').trim();
	const status = String(form.get('status') ?? 'disponible').trim();
	return {
		category_id: catRaw ? Number(catRaw) : null,
		code: String(form.get('code') ?? '').trim().toUpperCase(),
		name: str('name'),
		brand: str('brand'),
		model: str('model'),
		serial: str('serial'),
		location: str('location'),
		status: (['disponible', 'mantenimiento', 'baja'].includes(status)
			? status
			: 'disponible') as DeviceStatus,
		notes: str('notes')
	};
}

export function createDevice(input: DeviceInput): { id?: number; error?: string } {
	if (!input.category_id) return { error: 'Selecciona una categoría.' };
	let code = input.code;
	if (!code) {
		const cat = getCategory(input.category_id);
		if (!cat) return { error: 'Categoría no válida.' };
		code = nextDeviceCode(cat.code);
	}
	const exists = db.prepare('SELECT 1 FROM devices WHERE code = ? COLLATE NOCASE').get(code);
	if (exists) return { error: `Ya existe un equipo con el código ${code}.` };
	const info = db
		.prepare(
			`INSERT INTO devices (code, category_id, name, brand, model, serial, location, status, notes)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			code,
			input.category_id,
			input.name,
			input.brand,
			input.model,
			input.serial,
			input.location,
			input.status,
			input.notes
		);
	return { id: Number(info.lastInsertRowid) };
}

export function updateDevice(id: number, input: DeviceInput): { error?: string } {
	if (!input.code) return { error: 'El código es obligatorio.' };
	const clash = db
		.prepare('SELECT 1 FROM devices WHERE code = ? COLLATE NOCASE AND id <> ?')
		.get(input.code, id);
	if (clash) return { error: `Ya existe otro equipo con el código ${input.code}.` };
	const current = db.prepare('SELECT status FROM devices WHERE id = ?').get(id) as
		| { status: DeviceStatus }
		| undefined;
	if (!current) return { error: 'Equipo no encontrado.' };
	// «Prestado» solo lo cambia el flujo de préstamos.
	const status = current.status === 'prestado' ? 'prestado' : input.status;
	db.prepare(
		`UPDATE devices SET code = ?, category_id = ?, name = ?, brand = ?, model = ?,
			serial = ?, location = ?, status = ?, notes = ?, updated_at = datetime('now')
		 WHERE id = ?`
	).run(
		input.code,
		input.category_id,
		input.name,
		input.brand,
		input.model,
		input.serial,
		input.location,
		status,
		input.notes,
		id
	);
	return {};
}

/* ------------------------------- Usuarios ------------------------------- */
export function listUsers(onlyBorrowers = false): UserRow[] {
	const where = onlyBorrowers ? 'WHERE active = 1 AND can_borrow = 1' : '';
	return db
		.prepare(
			`SELECT id, name, email, identifier, role, can_borrow, active,
					(password_hash IS NOT NULL) AS has_login, created_at
			 FROM users ${where} ORDER BY name`
		)
		.all() as UserRow[];
}

export function getUser(id: number): UserRow | null {
	return (
		(db
			.prepare(
				`SELECT id, name, email, identifier, role, can_borrow, active,
						(password_hash IS NOT NULL) AS has_login, created_at
				 FROM users WHERE id = ?`
			)
			.get(id) as UserRow | undefined) ?? null
	);
}

const VALID_ROLES: Role[] = ['admin', 'gestor', 'consulta'];

export function normalizeRole(role: string): Role {
	const r = role.trim().toLowerCase() as Role;
	return VALID_ROLES.includes(r) ? r : 'consulta';
}

export function readUserForm(form: FormData): UserInput {
	const email = String(form.get('email') ?? '').trim().toLowerCase();
	const identifier = String(form.get('identifier') ?? '').trim();
	return {
		name: String(form.get('name') ?? '').trim(),
		email: email || null,
		identifier: identifier || null,
		role: normalizeRole(String(form.get('role') ?? 'consulta')),
		can_borrow: form.get('can_borrow') === 'on',
		active: form.get('active') === 'on'
	};
}

export function createUser(input: UserInput, passwordHash: string | null): { id?: number; error?: string } {
	if (!input.name) return { error: 'El nombre es obligatorio.' };
	if (input.email) {
		const clash = db.prepare('SELECT 1 FROM users WHERE email = ?').get(input.email);
		if (clash) return { error: `Ya existe un usuario con el correo ${input.email}.` };
	}
	const info = db
		.prepare(
			`INSERT INTO users (name, email, identifier, role, password_hash, can_borrow, active)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.name,
			input.email,
			input.identifier,
			input.role,
			passwordHash,
			input.can_borrow ? 1 : 0,
			input.active ? 1 : 0
		);
	return { id: Number(info.lastInsertRowid) };
}

export function updateUser(id: number, input: UserInput, newPasswordHash: string | null): { error?: string } {
	if (!input.name) return { error: 'El nombre es obligatorio.' };
	if (input.email) {
		const clash = db.prepare('SELECT 1 FROM users WHERE email = ? AND id <> ?').get(input.email, id);
		if (clash) return { error: `Ya existe otro usuario con el correo ${input.email}.` };
	}
	db.prepare(
		`UPDATE users SET name = ?, email = ?, identifier = ?, role = ?, can_borrow = ?, active = ?,
			updated_at = datetime('now') WHERE id = ?`
	).run(
		input.name,
		input.email,
		input.identifier,
		input.role,
		input.can_borrow ? 1 : 0,
		input.active ? 1 : 0,
		id
	);
	if (newPasswordHash) {
		db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, id);
	}
	return {};
}

/** Importación CSV: crea por nombre, actualiza si el correo ya existe. */
export function importUsers(rows: UserInput[]): { created: number; updated: number; skipped: number } {
	let created = 0,
		updated = 0,
		skipped = 0;
	const findByEmail = db.prepare('SELECT id FROM users WHERE email = ?');
	db.prepare('BEGIN').run();
	try {
		for (const r of rows) {
			if (!r.name) {
				skipped++;
				continue;
			}
			const existing = r.email ? (findByEmail.get(r.email) as { id: number } | undefined) : undefined;
			if (existing) {
				updateUser(existing.id, r, null);
				updated++;
			} else {
				const res = createUser(r, null);
				if (res.id) created++;
				else skipped++;
			}
		}
		db.prepare('COMMIT').run();
	} catch (e) {
		db.prepare('ROLLBACK').run();
		throw e;
	}
	return { created, updated, skipped };
}

/* ------------------------------- Préstamos ------------------------------- */
export function getLoanFull(id: number): LoanFull | null {
	return (
		(db
			.prepare(
				`SELECT l.id, l.device_id, d.code AS device_code, d.name AS device_name,
						c.name AS category_name, c.code AS category_code, d.brand, d.model, d.serial,
						l.borrower_name, bu.identifier AS borrower_identifier,
						l.checkout_at, l.due_at, l.returned_at, l.notes,
						op.name AS checked_out_by_name
				 FROM loans l
				 JOIN devices d ON d.id = l.device_id
				 LEFT JOIN categories c ON c.id = d.category_id
				 LEFT JOIN users bu ON bu.id = l.user_id
				 LEFT JOIN users op ON op.id = l.checked_out_by
				 WHERE l.id = ?`
			)
			.get(id) as LoanFull | undefined) ?? null
	);
}

export type CheckoutOpts = {
	deviceId: number;
	userId: number | null;
	borrowerName: string;
	dueAt: string | null;
	operatorId: number;
	notes?: string | null;
};

export function checkoutDevice(opts: CheckoutOpts): { ok: boolean; error?: string } {
	const device = db.prepare('SELECT status FROM devices WHERE id = ?').get(opts.deviceId) as
		| { status: DeviceStatus }
		| undefined;
	if (!device) return { ok: false, error: 'Equipo no encontrado.' };
	if (device.status === 'prestado') return { ok: false, error: 'El equipo ya está prestado.' };
	if (device.status === 'baja') return { ok: false, error: 'El equipo está dado de baja.' };

	const tx = db.prepare('BEGIN');
	try {
		tx.run();
		db.prepare(
			`INSERT INTO loans (device_id, user_id, borrower_name, checked_out_by, due_at, notes)
			 VALUES (?, ?, ?, ?, ?, ?)`
		).run(opts.deviceId, opts.userId, opts.borrowerName, opts.operatorId, opts.dueAt, opts.notes ?? null);
		db.prepare("UPDATE devices SET status = 'prestado', updated_at = datetime('now') WHERE id = ?").run(
			opts.deviceId
		);
		db.prepare('COMMIT').run();
		return { ok: true };
	} catch (e) {
		db.prepare('ROLLBACK').run();
		return { ok: false, error: (e as Error).message };
	}
}

export function returnDevice(deviceId: number, operatorId: number): { ok: boolean; error?: string } {
	const loan = db
		.prepare('SELECT id FROM loans WHERE device_id = ? AND returned_at IS NULL')
		.get(deviceId) as { id: number } | undefined;
	if (!loan) return { ok: false, error: 'El equipo no está prestado.' };
	try {
		db.prepare('BEGIN').run();
		db.prepare("UPDATE loans SET returned_at = datetime('now'), returned_to = ? WHERE id = ?").run(
			operatorId,
			loan.id
		);
		db.prepare("UPDATE devices SET status = 'disponible', updated_at = datetime('now') WHERE id = ?").run(
			deviceId
		);
		db.prepare('COMMIT').run();
		return { ok: true };
	} catch (e) {
		db.prepare('ROLLBACK').run();
		return { ok: false, error: (e as Error).message };
	}
}
