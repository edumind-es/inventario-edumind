import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		// En desarrollo se escucha solo en local; el modo red lo da scripts/server.mjs.
		host: '127.0.0.1',
		port: 5173
	}
});
