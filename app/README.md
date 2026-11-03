# Inventario EDUmind — código fuente de la aplicación

Aplicación **SvelteKit 2 + Svelte 5** (adapter-node) con **SQLite** nativo de Node
(`node:sqlite`), Tailwind CSS 4, `pdf-lib` + `qrcode` para etiquetas y actas, ZXing para
el escaneo con cámara y `papaparse` para la importación CSV. Sin base de datos externa, sin
servicios online.

> Este código se reconstruyó el 2026-11-03 a partir de los paquetes compilados 0.2.x (ver
> [DECISIONES.md](../DECISIONES.md), D13): la parte servidor se recuperó casi literal y las
> pantallas Svelte se reescribieron a partir del HTML compilado. Las rutas, la base de datos,
> el formato de QR y el hash de contraseñas son idénticos a 0.2.x, así que las instalaciones
> existentes siguen funcionando sin tocar sus datos.

## Desarrollo

```bash
cd app
npm install
npm run dev          # http://127.0.0.1:5173
```

Variables útiles:

| Variable | Uso |
|---|---|
| `EDUMIND_DB_PATH` | Ruta del fichero SQLite (por defecto, la zona de datos del sistema). |
| `EDUMIND_MODE` | `local` (HTTP en 127.0.0.1) o `red` (HTTPS autofirmado en toda la LAN). Solo `scripts/server.mjs`. |
| `PORT` | Puerto del servidor de producción (4600). |

Primer arranque: la app pide crear la cuenta de administración en `/setup`. Si se olvida
la contraseña: `npm run admin` (crea o restablece un administrador en la base de datos local).

## Compilar y probar en producción

```bash
npm run build
npm run start        # node --experimental-sqlite scripts/server.mjs
```

`scripts/run.mjs` es el supervisor que usan los lanzadores con icono: reinicia el servidor
cuando se cambia de modo desde *Sistema* (código de salida 75) y lo apaga con 0.

## Empaquetar (ZIP portables y .deb)

```bash
npm run package                           # 5 ZIP (Windows, macOS ×2, Linux ×2)
npm run package -- --deb                  # además los .deb amd64 y arm64
npm run package -- --targets linux-x64    # un solo target
```

El script descarga el Node oficial de nodejs.org (verificado con `SHASUMS256.txt`), instala
**solo** las dependencias de producción con `npm ci --omit=dev` y comprueba que `qrcode`,
`pdf-lib`, `papaparse` y `selfsigned` están en `node_modules/` antes de cerrar cada ZIP. Esa
comprobación existe porque los paquetes 0.2.0/0.2.1 se publicaron sin esos tres módulos y
por eso devolvían error 500 en etiquetas, actas, ficha de equipo, *Sistema* e importación CSV.

Los lanzadores (`.vbs`, bundle `.app`, `.sh`, `.desktop`, `postinst`) están en `packaging/`.
Los `.dmg` no se generan aquí: se crean en un Mac con `hdiutil` a partir del ZIP de macOS.

## Estructura

```
src/
  hooks.server.ts          sesión + redirecciones (/setup, /login)
  lib/server/db.ts         conexión SQLite, migraciones, ajustes, copia de seguridad
  lib/server/auth.ts       scrypt, sesiones, roles
  lib/server/queries.ts    equipos, usuarios, préstamos
  lib/qr.ts                formato EDUMIND1|CÓDIGO|CATEGORÍA
  lib/labels-presets.ts    plantillas APLI
  lib/components/          DeviceForm, UserForm, StatusBadge
  routes/                  una carpeta por pantalla; +server.ts para PDF y copia
scripts/                   server.mjs (dual local/red), run.mjs (supervisor), admin.mjs, package.mjs
packaging/                 lanzadores por sistema
static/                    iconos, manifest PWA, service worker (no cachea)
```

## Licencia

AGPL-3.0-or-later OR EUPL-1.2 · © Luis Vilela Acuña · EDUmind® es marca registrada
(ver [TRADEMARKS.md](../TRADEMARKS.md)).
