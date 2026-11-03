import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasRole } from '$lib/server/auth';
import { readDeviceForm, createDevice, listCategories } from '$lib/server/queries';

export const load: PageServerLoad = async ({ locals }) => {
	if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos.');
	return { categories: listCategories() };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos.');
		const form = await request.formData();
		const input = readDeviceForm(form);
		const result = createDevice(input);
		if (result.error) {
			return fail(400, { error: result.error, values: Object.fromEntries(form) as Record<string, string> });
		}
		throw redirect(303, `/devices/${result.id}`);
	}
};
