import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasRole } from '$lib/server/auth';
import { getSetting } from '$lib/server/db';
import { listCategories, listDevices } from '$lib/server/queries';
import { LABEL_PRESETS } from '$lib/labels-presets';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos para generar etiquetas.');
	// /labels?code=POR-0001 preselecciona ese equipo (enlace desde su ficha).
	const preCode = url.searchParams.get('code')?.toUpperCase() || null;
	return {
		devices: listDevices(),
		categories: listCategories(),
		presets: LABEL_PRESETS,
		preCode,
		offsets: {
			x: Number(getSetting('label_offset_x_mm', '0')),
			y: Number(getSetting('label_offset_y_mm', '0'))
		}
	};
};
