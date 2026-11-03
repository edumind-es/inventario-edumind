import { readFileSync } from 'node:fs';
import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasRole } from '$lib/server/auth';
import { db, setSetting, DATA_DIR, getSetting } from '$lib/server/db';

function appVersion(): string {
	try {
		return JSON.parse(readFileSync('package.json', 'utf8')).version ?? '';
	} catch {
		return '';
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
	return {
		version: appVersion(),
		dataDir: DATA_DIR,
		settings: {
			center_name: getSetting('center_name', ''),
			center_code: getSetting('center_code', ''),
			loan_default_days: getSetting('loan_default_days', '7'),
			label_offset_x_mm: getSetting('label_offset_x_mm', '0'),
			label_offset_y_mm: getSetting('label_offset_y_mm', '0'),
			center_logo: getSetting('center_logo', ''),
			lopd_text: getSetting('lopd_text', '')
		},
		categories: db
			.prepare(
				`SELECT c.id, c.code, c.name, c.color,
						(SELECT COUNT(*) FROM devices d WHERE d.category_id = c.id) AS device_count
				 FROM categories c ORDER BY c.name`
			)
			.all() as { id: number; code: string; name: string; color: string; device_count: number }[]
	};
};

export const actions: Actions = {
	saveGeneral: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const form = await request.formData();
		setSetting('center_name', String(form.get('center_name') ?? '').trim());
		setSetting('center_code', String(form.get('center_code') ?? '').trim());
		const days = Math.max(1, Number(form.get('loan_default_days') ?? 7) || 7);
		setSetting('loan_default_days', String(days));
		setSetting('label_offset_x_mm', String(Number(form.get('label_offset_x_mm') ?? 0) || 0));
		setSetting('label_offset_y_mm', String(Number(form.get('label_offset_y_mm') ?? 0) || 0));
		return { success: 'Ajustes guardados.' };
	},

	saveBranding: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const form = await request.formData();
		setSetting('lopd_text', String(form.get('lopd_text') ?? '').trim());
		const logo = String(form.get('logo_data') ?? '').trim();
		if (logo) {
			if (!/^data:image\/(png|jpeg|jpg);base64,/.test(logo)) {
				return fail(400, { brandError: 'El logo debe ser una imagen PNG o JPG.' });
			}
			if (logo.length > 950_000) {
				return fail(400, { brandError: 'El logo es demasiado grande (máx. ~700 KB).' });
			}
			setSetting('center_logo', logo);
		}
		return { success: 'Identidad del centro guardada.' };
	},

	removeLogo: async ({ locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		setSetting('center_logo', '');
		return { success: 'Logo eliminado.' };
	},

	addCategory: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const form = await request.formData();
		const code = String(form.get('code') ?? '').trim().toUpperCase();
		const name = String(form.get('name') ?? '').trim();
		const color = String(form.get('color') ?? '#0f766e').trim();
		if (!code || !name) return fail(400, { catError: 'Código y nombre son obligatorios.' });
		if (!/^[A-Z]{2,5}$/.test(code)) {
			return fail(400, { catError: 'El código debe tener de 2 a 5 letras (A-Z).' });
		}
		const clash = db.prepare('SELECT 1 FROM categories WHERE code = ?').get(code);
		if (clash) return fail(400, { catError: `Ya existe la categoría con código ${code}.` });
		db.prepare('INSERT INTO categories (code, name, color) VALUES (?, ?, ?)').run(code, name, color);
		return { success: 'Categoría añadida.' };
	},

	deleteCategory: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const id = Number((await request.formData()).get('id'));
		const inUse = db.prepare('SELECT COUNT(*) AS n FROM devices WHERE category_id = ?').get(id) as {
			n: number;
		};
		if (inUse.n > 0) {
			return fail(400, { catError: 'No se puede borrar: tiene equipos asignados.' });
		}
		db.prepare('DELETE FROM categories WHERE id = ?').run(id);
		return { success: 'Categoría eliminada.' };
	}
};
