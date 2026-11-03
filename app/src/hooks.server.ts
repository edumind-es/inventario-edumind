import { redirect, type Handle } from '@sveltejs/kit';
import { getSessionUser, hasAnyAdmin } from '$lib/server/auth';

/** Rutas accesibles sin sesión. */
const PUBLIC_PREFIXES = ['/login', '/setup'];

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = getSessionUser(event.cookies);

	const { pathname } = event.url;
	const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

	// Sin administrador todavía: todo lleva a la configuración inicial.
	if (!hasAnyAdmin() && pathname !== '/setup') {
		throw redirect(303, '/setup');
	}
	// Con administrador, /setup ya no tiene sentido.
	if (hasAnyAdmin() && pathname === '/setup') {
		throw redirect(303, event.locals.user ? '/' : '/login');
	}
	// Resto de rutas: exige sesión y recuerda a dónde se iba.
	if (!event.locals.user && !isPublic) {
		const next = encodeURIComponent(pathname + event.url.search);
		throw redirect(303, `/login?next=${next}`);
	}

	return resolve(event);
};
