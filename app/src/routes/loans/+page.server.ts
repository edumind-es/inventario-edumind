import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import type { LoanRow } from '$lib/server/queries';

const LOAN_SELECT = `
	SELECT l.id, l.device_id, d.code AS device_code, d.name AS device_name,
		c.name AS category_name, l.borrower_name, l.user_id, l.checkout_at,
		l.due_at, l.returned_at, l.notes, op.name AS checked_out_by_name
	FROM loans l
	JOIN devices d ON d.id = l.device_id
	LEFT JOIN categories c ON c.id = d.category_id
	LEFT JOIN users op ON op.id = l.checked_out_by
`;

export const load: PageServerLoad = async ({ url }) => {
	const filter = url.searchParams.get('filter') ?? 'active';
	let where = '';
	let order = 'ORDER BY l.checkout_at DESC';
	if (filter === 'active') {
		where = 'WHERE l.returned_at IS NULL';
		order = 'ORDER BY (l.due_at IS NULL), l.due_at ASC';
	} else if (filter === 'overdue') {
		where = "WHERE l.returned_at IS NULL AND l.due_at IS NOT NULL AND l.due_at < datetime('now')";
		order = 'ORDER BY l.due_at ASC';
	}

	const loans = db.prepare(`${LOAN_SELECT} ${where} ${order} LIMIT 500`).all() as LoanRow[];
	const counts = db
		.prepare(
			`SELECT
				SUM(CASE WHEN returned_at IS NULL THEN 1 ELSE 0 END) AS active,
				SUM(CASE WHEN returned_at IS NULL AND due_at IS NOT NULL AND due_at < datetime('now') THEN 1 ELSE 0 END) AS overdue,
				COUNT(*) AS all_count
			 FROM loans`
		)
		.get() as { active: number | null; overdue: number | null; all_count: number };

	return { loans, filter, counts };
};
