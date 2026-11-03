import { redirect, type Actions } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ cookies }) => {
		destroySession(cookies);
		throw redirect(303, '/login');
	}
};
