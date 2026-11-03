import type { SessionUser } from '$lib/server/auth';

// Tipos globales de SvelteKit: ver https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			/** Usuario de la sesión actual (null si no ha iniciado sesión). */
			user: SessionUser | null;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
