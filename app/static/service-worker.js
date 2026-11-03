/*
 * Service worker mínimo — Inventario EDUmind
 * -------------------------------------------------------------
 * Su única función es hacer la app "instalable" como PWA
 * (añadir a pantalla de inicio en iOS/Android).
 *
 * NO cachea páginas: la app depende de datos en vivo del servidor,
 * así que siempre se usa la red (network-first puro) para no mostrar
 * información desfasada.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
	// Passthrough: deja que el navegador gestione la petición con normalidad.
	// (La presencia de este handler es lo que habilita la instalación PWA.)
	return;
});
