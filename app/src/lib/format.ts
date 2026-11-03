/** Fechas: SQLite guarda `YYYY-MM-DD HH:MM:SS` en UTC. */
function toDate(value: string | null | undefined): Date | null {
	if (!value) return null;
	const iso = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
	const d = new Date(iso);
	return isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | null | undefined): string {
	const d = toDate(value);
	if (!d) return '—';
	return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
	const d = toDate(value);
	if (!d) return '—';
	return d.toLocaleString('es-ES', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function isOverdue(dueAt: string | null | undefined, returnedAt: string | null | undefined): boolean {
	if (returnedAt || !dueAt) return false;
	const d = toDate(dueAt);
	return d ? d.getTime() < Date.now() : false;
}
