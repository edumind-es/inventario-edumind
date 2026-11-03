import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { readDeviceForm, updateDevice, listCategories, type Device } from '$lib/server/queries';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos.');
	const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(Number(params.id)) as Device | undefined;
	if (!device) throw error(404, 'Equipo no encontrado.');
	return { device, categories: listCategories() };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos.');
		const id = Number(params.id);
		const form = await request.formData();
		const input = readDeviceForm(form);
		const res = updateDevice(id, input);
		if (res.error) {
			return fail(400, { error: res.error, values: Object.fromEntries(form) as Record<string, string> });
		}
		throw redirect(303, `/devices/${id}`);
	}
};
