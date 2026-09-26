# Créditos y material de terceros

Inventario EDUmind es obra de Luis Vilela Acuña (EDUmind®). Este fichero acredita el
material ajeno que va dentro de los paquetes distribuidos (ZIP, `.deb`, `.dmg`) y en
la web de descargas. Las versiones exactas son las de los paquetes 0.2.0/0.2.1; los
rangos son los declarados en el `package.json` de la aplicación.

## Software de terceros incluido en los paquetes

| Componente | Versión | Licencia | Origen | Dónde va |
|---|---|---|---|---|
| Node.js | 22.23.1 | MIT (más las licencias de sus componentes, ver `LICENSE` de Node) | https://nodejs.org | `runtime/` (binario completo) |
| Svelte | ^5.20 | MIT | https://svelte.dev | compilado en `build/` |
| SvelteKit y `@sveltejs/adapter-node` | ^2.20 / ^5.2 | MIT | https://svelte.dev/docs/kit | compilado en `build/` |
| Tailwind CSS (`@tailwindcss/vite`) | ^4.0 | MIT | https://tailwindcss.com | compilado en `build/` |
| `@zxing/browser` | ^0.1.5 | Apache-2.0 | https://github.com/zxing-js/browser | compilado en `build/client` (escaneo de QR por cámara) |
| `@zxing/library` | ^0.21.3 | Apache-2.0 | https://github.com/zxing-js/library | compilado en `build/client` |
| pdf-lib | ^1.17.1 | MIT | https://pdf-lib.js.org | servidor (actas y hojas de etiquetas en PDF) |
| qrcode | ^1.5.4 | MIT | https://github.com/soldair/node-qrcode | servidor (códigos QR de etiquetas y del modo red) |
| papaparse | ^5.4.1 | MIT | https://www.papaparse.com | servidor (importación CSV de usuarios) |
| node-forge | 1.4.0 | BSD-3-Clause OR GPL-2.0 | https://github.com/digitalbazaar/forge | `node_modules/` (dependencia de `selfsigned`) |
| selfsigned | 2.4.1 | MIT | https://github.com/jfromaniello/selfsigned | `node_modules/` (certificado autofirmado del modo red) |
| Vite, TypeScript, svelte-check, pngjs | ^6 / ^5.7 / ^4.1 / ^7 | MIT | — | solo en desarrollo, no se distribuyen |

Avisos pendientes de incluir **dentro** de los paquetes en el próximo empaquetado (hoy solo
llevan los `LICENSE` de `node-forge`, `selfsigned` y `@types`): el `LICENSE` de Node.js y este
fichero, para cumplir el requisito de conservar el aviso de Apache-2.0 (ZXing) y de las
licencias MIT/BSD.

## Imágenes

- `web/logo.png` (también `logo-edumind.png`, `icons/*.png` y `favicon.png` en la app):
  ilustración «inventario EDUmind» (caja con dispositivos y el globo EDUmind). Identidad
  propia de EDUmind®, marca registrada de Luis Vilela Acuña; no se cede con el código
  (ver TRADEMARKS.md). Origen de la ilustración: pendiente de confirmar por el autor
  (posible generación con IA a partir de la identidad EDUmind).
- `favicon.svg`: cuadrado teal con las letras «EM», propio.

## Tipografías, sonidos y vídeo

No hay. La app y la web usan la tipografía del sistema (`system-ui`) y no incluyen
audio ni vídeo.

## Datos de ejemplo

`ejemplos/usuarios-ejemplo.csv` (dentro de los ZIP) contiene nombres ficticios.

## Cómo citar este proyecto

Luis Vilela Acuña (2026). *Inventario EDUmind* [software]. https://github.com/edumind-es/inventario-edumind
