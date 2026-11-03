import { fail, redirect, type Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { verifyPassword, pruneSessions, createSession } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');

		const user = db.prepare('SELECT id, password_hash, active FROM users WHERE email = ?').get(email) as
			| { id: number; password_hash: string | null; active: number }
			| undefined;

		if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
			return fail(400, { error: 'Correo o contraseña incorrectos.', email });
		}

		pruneSessions();
		createSession(user.id, cookies);

		const next = url.searchParams.get('next');
		throw redirect(303, next && next.startsWith('/') ? next : '/');
	}
};
