/**
 * Recuperación de acceso sin terminal — Inventario EDUmind
 * =====================================================================
 * Equivale a `scripts/admin.mjs` pero desde la propia app. La garantía es la
 * misma que la del terminal: hay que estar sentado en el ordenador servidor.
 *
 *  1. Solo se ofrece a peticiones que llegan desde el propio equipo (127.0.0.1).
 *  2. Al pedirla, se escribe un código de un solo uso en `recuperacion.txt`
 *     dentro de la carpeta de datos; la app muestra la ruta, no el código.
 *  3. Con ese código se elige una cuenta de administración y se fija una
 *     contraseña nueva. El código caduca a los 10 minutos, se consume al usarlo
 *     y se anula tras 5 intentos fallidos.
 *
 * El código se guarda en la tabla `settings` como hash scrypt (igual que las
 * contraseñas); el fichero en claro es el único sitio donde está legible.
 */
import { randomInt } from 'node:crypto';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { db, DATA_DIR, getSetting, setSetting } from './db';
import { hashPassword, verifyPassword } from './auth';

export const RECOVERY_FILE = join(DATA_DIR, 'recuperacion.txt');
const VALID_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const K_HASH = 'recovery_code_hash';
const K_EXPIRES = 'recovery_expires';
const K_ATTEMPTS = 'recovery_attempts';

/** ¿La petición viene del propio ordenador donde corre el servidor? */
export function isLocalRequest(address: string): boolean {
	return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address);
}

/** Correo parcialmente oculto para la pista de la pantalla de acceso: l…a@live.com */
export function maskEmail(email: string | null): string {
	if (!email || !email.includes('@')) return '—';
	const [user, domain] = email.split('@');
	if (user.length <= 2) return `${user[0]}…@${domain}`;
	return `${user[0]}…${user[user.length - 1]}@${domain}`;
}

export type AdminOption = { id: number; name: string; emailMasked: string };

/** Cuentas de administración (activas o no) entre las que elegir. */
export function listAdmins(): AdminOption[] {
	const rows = db
		.prepare("SELECT id, name, email FROM users WHERE role = 'admin' AND email IS NOT NULL ORDER BY name")
		.all() as { id: number; name: string; email: string | null }[];
	return rows.map((r) => ({ id: r.id, name: r.name, emailMasked: maskEmail(r.email) }));
}

/** Genera el código, lo escribe en el fichero y devuelve la ruta. */
export function issueRecoveryCode(): { file: string; expiresAt: Date } {
	const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
	const expiresAt = new Date(Date.now() + VALID_MINUTES * 60_000);
	setSetting(K_HASH, hashPassword(code));
	setSetting(K_EXPIRES, expiresAt.toISOString());
	setSetting(K_ATTEMPTS, '0');
	writeFileSync(
		RECOVERY_FILE,
		[
			'Inventario EDUmind — código de recuperación de acceso',
			'',
			`Código: ${code}`,
			'',
			`Válido hasta: ${expiresAt.toLocaleString('es-ES')} (${VALID_MINUTES} minutos).`,
			'Escríbelo en la pantalla «Recuperar acceso» de la aplicación, en este mismo ordenador.',
			'Este fichero se borra solo al usar el código. Si no has pedido tú esta recuperación,',
			'bórralo y cambia la contraseña de administración.',
			''
		].join('\n'),
		{ mode: 0o600 }
	);
	return { file: RECOVERY_FILE, expiresAt };
}

/** ¿Hay un código vigente (emitido y no caducado)? */
export function recoveryPending(): boolean {
	const exp = getSetting(K_EXPIRES, '');
	return !!getSetting(K_HASH, '') && !!exp && new Date(exp).getTime() > Date.now();
}

export function clearRecovery() {
	setSetting(K_HASH, '');
	setSetting(K_EXPIRES, '');
	setSetting(K_ATTEMPTS, '0');
	try {
		rmSync(RECOVERY_FILE, { force: true });
	} catch {
		/* no crítico */
	}
}

/** Comprueba el código: vigente, correcto y con intentos disponibles. */
export function checkRecoveryCode(code: string): { ok: boolean; error?: string } {
	if (!recoveryPending()) {
		clearRecovery();
		return { ok: false, error: 'No hay ningún código vigente. Pide uno nuevo.' };
	}
	const attempts = Number(getSetting(K_ATTEMPTS, '0')) + 1;
	if (attempts > MAX_ATTEMPTS) {
		clearRecovery();
		return { ok: false, error: 'Demasiados intentos. Pide un código nuevo.' };
	}
	setSetting(K_ATTEMPTS, String(attempts));
	if (!verifyPassword(code.trim(), getSetting(K_HASH, ''))) {
		return { ok: false, error: `Código incorrecto (intento ${attempts} de ${MAX_ATTEMPTS}).` };
	}
	return { ok: true };
}

/** Fija la contraseña nueva, asegura rol admin y cuenta activa. */
export function resetAdminPassword(userId: number, password: string): { ok: boolean; error?: string } {
	const u = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'admin'").get(userId);
	if (!u) return { ok: false, error: 'Cuenta no válida.' };
	db.prepare(
		"UPDATE users SET password_hash = ?, active = 1, updated_at = datetime('now') WHERE id = ?"
	).run(hashPassword(password), userId);
	// Cierra las sesiones abiertas de esa cuenta: la contraseña ha cambiado.
	db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
	clearRecovery();
	return { ok: true };
}
