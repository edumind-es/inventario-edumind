/**
 * /recuperar — restablecer la contraseña de administración sin terminal.
 * Solo desde el propio ordenador servidor (ver $lib/server/recovery.ts).
 */
import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSession } from '$lib/server/auth';
import { getSetting } from '$lib/server/db';
import {
	checkRecoveryCode, issueRecoveryCode, isLocalRequest, listAdmins, recoveryPending,
	resetAdminPassword, RECOVERY_FILE
} from '$lib/server/recovery';

function requireLocal(getClientAddress: () => string) {
	if (!isLocalRequest(getClientAddress())) {
		throw error(403, 'La recuperación de acceso solo está disponible en el ordenador donde se ejecuta la aplicación.');
	}
}

export const load: PageServerLoad = async ({ getClientAddress, locals }) => {
	requireLocal(getClientAddress);
	if (locals.user) throw redirect(303, '/');
	return {
		centerName: getSetting('center_name', 'Centro Educativo'),
		admins: listAdmins(),
		pending: recoveryPending(),
		file: RECOVERY_FILE
	};
};

export const actions: Actions = {
	/** Paso 1: escribe el código en la carpeta de datos. */
	generar: async ({ getClientAddress }) => {
		requireLocal(getClientAddress);
		if (listAdmins().length === 0) {
			return fail(400, { error: 'No hay ninguna cuenta de administración con correo. Usa scripts/admin.mjs.' });
		}
		const { file, expiresAt } = issueRecoveryCode();
		return { issued: true, file, expiresAt: expiresAt.toISOString() };
	},

	/** Paso 2: código + cuenta + contraseña nueva. */
	restablecer: async ({ request, getClientAddress, cookies }) => {
		requireLocal(getClientAddress);
		const form = await request.formData();
		const code = String(form.get('code') ?? '');
		const userId = Number(form.get('user_id'));
		const password = String(form.get('password') ?? '');
		const password2 = String(form.get('password2') ?? '');
		const values = { code, user_id: String(form.get('user_id') ?? '') };

		if (!code.trim()) return fail(400, { error: 'Escribe el código del fichero.', values });
		if (!userId) return fail(400, { error: 'Elige la cuenta que quieres recuperar.', values });
		if (password.length < 8) {
			return fail(400, { error: 'La contraseña debe tener al menos 8 caracteres.', values });
		}
		if (password !== password2) return fail(400, { error: 'Las contraseñas no coinciden.', values });

		const check = checkRecoveryCode(code);
		if (!check.ok) return fail(400, { error: check.error, values });

		const res = resetAdminPassword(userId, password);
		if (!res.ok) return fail(400, { error: res.error, values });

		createSession(userId, cookies);
		throw redirect(303, '/');
	}
};
