import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Salida en build/ (la lee scripts/server.mjs). Sin precompresión: el
		// paquete ya va comprimido y Node sirve en red local.
		adapter: adapter({ out: 'build', precompress: true }),
		// El service worker vive en static/ y se registra a mano desde app.html
		// (no cachea nada; solo habilita la instalación PWA).
		serviceWorker: { register: false }
	}
};

export default config;
