import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import Papa from 'papaparse';
import { hasRole } from '$lib/server/auth';
import { normalizeRole, importUsers, type UserInput } from '$lib/server/queries';

export const load: PageServerLoad = async ({ locals }) => {
	if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
	return {};
};

/** Normaliza cabeceras: sin acentos, minúsculas, sin espacios sobrantes. */
function norm(h: string): string {
	return h
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.trim()
		.toLowerCase();
}

/** Cabeceras admitidas (en español o inglés) → campo interno. */
const HEADER_MAP: Record<string, string> = {
	nombre: 'name',
	name: 'name',
	'nombre completo': 'name',
	email: 'email',
	correo: 'email',
	'correo electronico': 'email',
	identificador: 'identifier',
	dni: 'identifier',
	'nº empleado': 'identifier',
	'n empleado': 'identifier',
	rol: 'role',
	role: 'role',
	perfil: 'role'
};

type CsvRow = { name?: string; email?: string; identifier?: string; role?: string };

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!hasRole(locals.user, 'admin')) throw error(403, 'Solo administración.');
		const csv = String((await request.formData()).get('csv') ?? '').trim();
		if (!csv) return fail(400, { error: 'Pega o sube un CSV con al menos una fila.' });

		const parsed = Papa.parse<CsvRow>(csv, {
			header: true,
			skipEmptyLines: true,
			transformHeader: (h) => HEADER_MAP[norm(h)] ?? norm(h)
		});
		if (parsed.errors.length) {
			return fail(400, { error: `Error al leer el CSV: ${parsed.errors[0].message}` });
		}

		const rows: UserInput[] = [];
		for (const r of parsed.data) {
			const name = (r.name ?? '').trim();
			if (!name) continue;
			rows.push({
				name,
				email: (r.email ?? '').trim().toLowerCase() || null,
				identifier: (r.identifier ?? '').trim() || null,
				role: normalizeRole(r.role ?? 'consulta'),
				can_borrow: true,
				active: true
			});
		}
		if (rows.length === 0) {
			return fail(400, {
				error: 'No se encontró ninguna fila válida. Asegúrate de incluir una columna "nombre".'
			});
		}

		const result = importUsers(rows);
		return {
			success: `Importación completada: ${result.created} creados, ${result.updated} actualizados, ${result.skipped} omitidos.`
		};
	}
};
