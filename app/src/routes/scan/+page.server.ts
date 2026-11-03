import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasRole } from '$lib/server/auth';
import { parseScan } from '$lib/qr';
import { getDeviceByCode } from '$lib/server/queries';

/** /scan?code=XXX → redirige a la ficha del equipo si existe. */
export const load: PageServerLoad = async ({ url, locals }) => {
	if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos para escanear.');
	const raw = url.searchParams.get('code');
	if (!raw) return { notFoundCode: null };

	const parsed = parseScan(raw);
	if (parsed) {
		const device = getDeviceByCode(parsed.code);
		if (device) throw redirect(303, `/devices/${device.id}`);
		return { notFoundCode: parsed.code };
	}
	return { notFoundCode: raw };
};
