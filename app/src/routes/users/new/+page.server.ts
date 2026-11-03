import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasRole, hashPassword } from '$lib/server/auth';
import { readUserForm, createUser } from '$lib/server/queries';

export const load: PageServerLoad = async ({ locals }) => {
	if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const form = await request.formData();
		const input = readUserForm(form);
		const password = String(form.get('password') ?? '');
		if (password && password.length < 8) {
			return fail(400, {
				error: 'La contraseña debe tener al menos 8 caracteres.',
				values: Object.fromEntries(form) as Record<string, string>
			});
		}
		const res = createUser(input, password ? hashPassword(password) : null);
		if (res.error) {
			return fail(400, { error: res.error, values: Object.fromEntries(form) as Record<string, string> });
		}
		throw redirect(303, '/users');
	}
};
