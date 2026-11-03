import { fail, redirect, type Actions } from '@sveltejs/kit';
import { db, setSetting } from '$lib/server/db';
import { hasAnyAdmin, hashPassword, createSession } from '$lib/server/auth';

/** Primer arranque: nombre del centro y cuenta de administración. */
export const actions: Actions = {
	default: async ({ request, cookies }) => {
		if (hasAnyAdmin()) throw redirect(303, '/login');

		const form = await request.formData();
		const centerName = String(form.get('center_name') ?? '').trim();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');
		const password2 = String(form.get('password2') ?? '');
		const values = { center_name: centerName, name, email };

		if (!name || !email || !password) {
			return fail(400, { error: 'Completa todos los campos obligatorios.', values });
		}
		if (password.length < 8) {
			return fail(400, { error: 'La contraseña debe tener al menos 8 caracteres.', values });
		}
		if (password !== password2) {
			return fail(400, { error: 'Las contraseñas no coinciden.', values });
		}

		if (centerName) setSetting('center_name', centerName);
		const info = db
			.prepare(
				`INSERT INTO users (name, email, role, password_hash, can_borrow, active)
				 VALUES (?, ?, 'admin', ?, 1, 1)`
			)
			.run(name, email, hashPassword(password));

		createSession(Number(info.lastInsertRowid), cookies);
		throw redirect(303, '/');
	}
};
