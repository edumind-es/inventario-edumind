import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import QRCode from 'qrcode';
import { hasRole } from '$lib/server/auth';
import { db, getSetting } from '$lib/server/db';
import { buildQrPayload } from '$lib/qr';
import { getDeviceView, deviceHistory, listUsers, checkoutDevice, returnDevice } from '$lib/server/queries';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	const device = getDeviceView(id);
	if (!device) throw error(404, 'Equipo no encontrado.');

	const qrSvg = await QRCode.toString(buildQrPayload(device.code, device.category_code), {
		type: 'svg',
		margin: 1,
		errorCorrectionLevel: 'M'
	});

	return {
		device,
		history: deviceHistory(id),
		borrowers: listUsers(true),
		qrSvg,
		defaultLoanDays: Number(getSetting('loan_default_days', '7'))
	};
};

export const actions: Actions = {
	checkout: async ({ request, params, locals }) => {
		if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos.');
		const id = Number(params.id);
		const form = await request.formData();
		const userIdRaw = String(form.get('user_id') ?? '').trim();
		const manualName = String(form.get('borrower_name') ?? '').trim();
		const dueRaw = String(form.get('due_at') ?? '').trim();
		const notes = String(form.get('notes') ?? '').trim();

		let userId: number | null = null;
		let borrowerName = manualName;
		if (userIdRaw) {
			userId = Number(userIdRaw);
			const u = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
			if (u) borrowerName = u.name;
		}
		if (!borrowerName) {
			return fail(400, { error: 'Indica quién se lleva el equipo (usuario o nombre).' });
		}

		const dueAt = dueRaw ? `${dueRaw} 12:00:00` : null;
		const res = checkoutDevice({
			deviceId: id,
			userId,
			borrowerName,
			dueAt,
			operatorId: locals.user.id,
			notes
		});
		if (!res.ok) return fail(400, { error: res.error });
		return { success: 'Préstamo registrado.' };
	},

	return: async ({ params, locals }) => {
		if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos.');
		const res = returnDevice(Number(params.id), locals.user.id);
		if (!res.ok) return fail(400, { error: res.error });
		return { success: 'Devolución registrada.' };
	},

	delete: async ({ params, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración puede eliminar.');
		db.prepare('DELETE FROM devices WHERE id = ?').run(Number(params.id));
		throw redirect(303, '/devices');
	}
};
