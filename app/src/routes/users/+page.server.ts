import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { listUsers } from '$lib/server/queries';

export const load: PageServerLoad = async ({ locals }) => {
	if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
	return { users: listUsers() };
};

export const actions: Actions = {
	toggleActive: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const id = Number((await request.formData()).get('id'));
		if (id === locals.user.id) return fail(400, { error: 'No puedes desactivar tu propia cuenta.' });
		db.prepare('UPDATE users SET active = 1 - active WHERE id = ?').run(id);
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const id = Number((await request.formData()).get('id'));
		if (id === locals.user.id) return fail(400, { error: 'No puedes eliminar tu propia cuenta.' });
		db.prepare('DELETE FROM users WHERE id = ?').run(id);
		return { success: true };
	}
};
