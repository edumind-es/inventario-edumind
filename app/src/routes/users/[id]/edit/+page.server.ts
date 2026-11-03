import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasRole, hashPassword } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { readUserForm, updateUser, getUser } from '$lib/server/queries';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
	const user = getUser(Number(params.id));
	if (!user) throw error(404, 'Usuario no encontrado.');
	return { editUser: user };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const id = Number(params.id);
		const form = await request.formData();
		const input = readUserForm(form);
		const password = String(form.get('password') ?? '');
		if (password && password.length < 8) {
			return fail(400, {
				error: 'La contraseña debe tener al menos 8 caracteres.',
				values: Object.fromEntries(form) as Record<string, string>
			});
		}
		const res = updateUser(id, input, password ? hashPassword(password) : null);
		if (res.error) {
			return fail(400, { error: res.error, values: Object.fromEntries(form) as Record<string, string> });
		}
		throw redirect(303, '/users');
	},

	delete: async ({ params, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const id = Number(params.id);
		if (id === locals.user.id) return fail(400, { error: 'No puedes eliminar tu propia cuenta.' });
		db.prepare('DELETE FROM users WHERE id = ?').run(id);
		throw redirect(303, '/users');
	}
};
