import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import type { LoanRow } from '$lib/server/queries';

const LOAN_SELECT = `
	SELECT l.id, l.device_id, d.code AS device_code, d.name AS device_name,
		c.name AS category_name, l.borrower_name, l.user_id, l.checkout_at,
		l.due_at, l.returned_at, l.notes,
		op.name AS checked_out_by_name
	FROM loans l
	JOIN devices d ON d.id = l.device_id
	LEFT JOIN categories c ON c.id = d.category_id
	LEFT JOIN users op ON op.id = l.checked_out_by
`;

export const load: PageServerLoad = async () => {
	const counts = db
		.prepare(
			`SELECT
				COUNT(*) AS total,
				SUM(CASE WHEN status = 'disponible' THEN 1 ELSE 0 END) AS disponibles,
				SUM(CASE WHEN status = 'prestado' THEN 1 ELSE 0 END) AS prestados,
				SUM(CASE WHEN status = 'mantenimiento' THEN 1 ELSE 0 END) AS mantenimiento,
				SUM(CASE WHEN status = 'baja' THEN 1 ELSE 0 END) AS baja
			 FROM devices`
		)
		.get() as {
		total: number | null;
		disponibles: number | null;
		prestados: number | null;
		mantenimiento: number | null;
		baja: number | null;
	};

	const overdue = db
		.prepare(
			"SELECT COUNT(*) AS n FROM loans WHERE returned_at IS NULL AND due_at IS NOT NULL AND due_at < datetime('now')"
		)
		.get() as { n: number };

	const activeLoans = db
		.prepare(
			`${LOAN_SELECT}
			 WHERE l.returned_at IS NULL
			 ORDER BY (l.due_at IS NULL), l.due_at ASC, l.checkout_at DESC
			 LIMIT 8`
		)
		.all() as LoanRow[];

	const recent = db
		.prepare(
			`${LOAN_SELECT}
			 ORDER BY COALESCE(l.returned_at, l.checkout_at) DESC
			 LIMIT 6`
		)
		.all() as LoanRow[];

	return {
		counts: {
			total: counts.total ?? 0,
			disponibles: counts.disponibles ?? 0,
			prestados: counts.prestados ?? 0,
			mantenimiento: counts.mantenimiento ?? 0,
			baja: counts.baja ?? 0,
			overdue: overdue.n
		},
		activeLoans,
		recent
	};
};
