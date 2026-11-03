/**
 * Sistema: modo local/red, QR de acceso para móviles y apagado.
 * El cambio de modo escribe mode.txt y sale con código 75; scripts/run.mjs
 * (el supervisor de la app instalada) reinicia el servidor con el modo nuevo.
 */
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import QRCode from 'qrcode';
import { hasRole } from '$lib/server/auth';
import { DATA_DIR } from '$lib/server/db';

function lanIp(): string {
	const nets = networkInterfaces();
	for (const name of Object.keys(nets)) {
		for (const net of nets[name] ?? []) {
			if (net.family === 'IPv4' && !net.internal) return net.address;
		}
	}
	return '127.0.0.1';
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');

	const mode = (process.env.EDUMIND_MODE ?? 'local').toLowerCase() === 'red' ? 'red' : 'local';
	const supervised = process.env.EDUMIND_SUPERVISED === '1';
	const port = process.env.PORT ?? '4600';
	const scheme = mode === 'red' ? 'https' : 'http';
	const ip = lanIp();
	const networkUrl = mode === 'red' ? `https://${ip}:${port}` : null;
	const localUrl = `${scheme}://localhost:${port}`;
	const qrSvg = networkUrl
		? await QRCode.toString(networkUrl, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
		: null;

	return { mode, supervised, port, ip, networkUrl, localUrl, qrSvg };
};

/** Da tiempo a enviar la respuesta antes de salir. */
function scheduleExit(code: number) {
	setTimeout(() => process.exit(code), 700);
}

export const actions: Actions = {
	setMode: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		if (process.env.EDUMIND_SUPERVISED !== '1') {
			return fail(400, { error: 'El cambio de modo solo está disponible en la app instalada.' });
		}
		const mode = String((await request.formData()).get('mode') ?? '').toLowerCase();
		if (mode !== 'local' && mode !== 'red') return fail(400, { error: 'Modo no válido.' });

		writeFileSync(join(DATA_DIR, 'mode.txt'), mode);
		const port = process.env.PORT ?? '4600';
		const url = mode === 'red' ? `https://${lanIp()}:${port}` : `http://127.0.0.1:${port}`;
		scheduleExit(75);
		return { restarting: true, mode, url };
	},

	shutdown: async ({ locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		if (process.env.EDUMIND_SUPERVISED !== '1') {
			return fail(400, { error: 'Apagar solo está disponible en la app instalada.' });
		}
		scheduleExit(0);
		return { shuttingDown: true };
	}
};
