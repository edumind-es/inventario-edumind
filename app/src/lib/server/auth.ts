/**
 * Autenticación y sesiones — Inventario EDUmind
 * =====================================================================
 * Contraseñas con scrypt y sal (formato `scrypt$<sal hex>$<hash hex>`;
 * `scripts/admin.mjs` usa el mismo). Sesiones en tabla `sessions` con
 * cookie HttpOnly de 30 días.
 */
import { scryptSync, timingSafeEqual, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { db } from './db';
import type { Role } from '$lib/roles';

export const SESSION_COOKIE = 'edumind_session';
const SESSION_DAYS = 30;

export type SessionUser = {
	id: number;
	name: string;
	email: string | null;
	role: Role;
};

export function hashPassword(password: string): string {
	const salt = randomBytes(16);
	const derived = scryptSync(password, salt, 64);
	return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
	if (!stored) return false;
	const [scheme, saltHex, hashHex] = stored.split('$');
	if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
	const salt = Buffer.from(saltHex, 'hex');
	const expected = Buffer.from(hashHex, 'hex');
	const derived = scryptSync(password, salt, expected.length);
	return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function createSession(userId: number, cookies: Cookies) {
	const token = randomBytes(32).toString('hex');
	const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
	db.prepare(
		"INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime(?, 'unixepoch'))"
	).run(token, userId, Math.floor(expires.getTime() / 1e3));
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		// En modo red (HTTPS) la cookie es 'secure'; en modo local (HTTP) no,
		// para que funcione sin certificado. Se deriva del esquema de ORIGIN.
		secure: (process.env.ORIGIN ?? '').startsWith('https'),
		expires
	});
}

export function destroySession(cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSessionUser(cookies: Cookies): SessionUser | null {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;
	const row = db
		.prepare(
			`SELECT u.id, u.name, u.email, u.role
			 FROM sessions s JOIN users u ON u.id = s.user_id
			 WHERE s.token = ? AND s.expires_at > datetime('now') AND u.active = 1`
		)
		.get(token) as SessionUser | undefined;
	return row ?? null;
}

export function pruneSessions() {
	db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}

const RANK: Record<Role, number> = { consulta: 0, gestor: 1, admin: 2 };

/** ¿Tiene el usuario al menos el rol indicado? (consulta < gestor < admin) */
export function hasRole(user: SessionUser | null | undefined, min: Role): user is SessionUser {
	if (!user) return false;
	return RANK[user.role] >= RANK[min];
}

/** ¿Existe ya alguna cuenta de administración con contraseña? (si no, /setup) */
export function hasAnyAdmin(): boolean {
	const row = db
		.prepare(
			"SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND password_hash IS NOT NULL AND active = 1"
		)
		.get() as { n: number };
	return row.n > 0;
}
