# Registro de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/). Las versiones
se refieren a los paquetes publicados en GitHub Releases.

## [Sin publicar] — código fuente de la aplicación (2026-11-03)
- Nuevo directorio `app/` con el proyecto SvelteKit completo, reconstruido a partir de los
  paquetes 0.2.x (ver DECISIONES.md, D13): servidor, pantallas, estilos, estáticos, scripts
  de arranque y lanzadores de Windows, macOS y Linux (`app/packaging/`).
- `app/scripts/package.mjs`: empaquetado reproducible (descarga Node verificado, `npm ci
  --omit=dev`, ZIP por sistema, `.deb` opcional, `SHA256SUMS.txt`). Falla si faltan
  `qrcode`, `pdf-lib`, `papaparse` o `selfsigned`, la causa del error 500 de 0.2.x.
- Pendiente para 0.2.2: compilar y publicar los paquetes desde este fuente.

## [Sin publicar] — web de descargas y documentación (2026-09-26)
Sin cambios en los paquetes de la aplicación (siguen siendo los de 0.2.1).
- Web de descargas: instrucción correcta para Windows (no existe `Setup.exe`: se extrae el
  ZIP y se abre `Iniciar Inventario.vbs`); nota sobre los `.dmg`/`.deb` con nombre 0.2.0;
  contraste de los hashes ≥ 4,5:1; tabla desplazable en pantallas de 375 px; landmark
  `<main>`; autoría de Luis Vilela Acuña y doble licencia en el pie; enlaces a créditos,
  repositorio y política de IA.
- `NOTICE`: retirada la afirmación sobre firma GPG (no se publican firmas) y el marcador de
  registro Safe Creative pendiente; versión ya no fijada a 0.2.0.
- Doble licencia AGPL-3.0-or-later OR EUPL-1.2 (`LICENSE`, `LICENSE-AGPL-3.0-or-later.txt`,
  `LICENSE-EUPL-1.2.txt`); `COPYRIGHT` y `AUTHORS` coherentes (sin «All rights reserved»
  ni plantillas sin rellenar).
- Nuevos `CREDITS.md` (Node, Svelte, SvelteKit, Tailwind, ZXing, pdf-lib, qrcode, papaparse,
  node-forge, selfsigned), `DECISIONES.md`, `PRIVACIDAD.md` y este `CHANGELOG.md`.
- README: sección «Hecho con IA», «Cómo modificarlo» y aviso de la incidencia conocida de
  los paquetes 0.2.x (faltan `qrcode`, `pdf-lib` y `papaparse` en `node_modules/`).

## [0.2.1] — 2026-09-11
Solo cambia el paquete de Windows.
- `Iniciar Inventario.vbs` comprueba que existe `runtime\node.exe` y, si se ejecutó dentro
  del ZIP sin extraer (error `80070002`), explica en español que hay que extraerlo.
- `LEEME.txt` abre con ese aviso y explica qué hacer si salta SmartScreen.
- Los `.dmg` y `.deb` son las compilaciones de 0.2.0 y conservan su nombre.

## [0.2.0] — 2026-07-13
Primera versión pública: inventario local-first (equipos, categorías, códigos automáticos,
estado, ubicación), préstamos con acta PDF, etiquetas QR imprimibles (APLI), escaneo por
cámara o lector USB, usuarios con roles e importación CSV, modo red opcional por la WiFi
del centro. Paquetes para Windows, macOS (Intel y Apple Silicon) y Linux (x64 y ARM,
incluido Abalar), con Node 22 incluido.
