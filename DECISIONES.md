# Registro de decisiones — Inventario EDUmind

> Redactado a posteriori el 2026-09-26, a partir del código distribuido, las notas de
> release y los comentarios de `scripts/*.mjs`. Recoge cómo funciona hoy el recurso y por
> qué se hizo así. Las decisiones nuevas se añaden al final con su fecha.

## D1. Local-first: los datos viven en el ordenador del centro
La base de datos es un fichero SQLite (`inventario.db`) en la zona de datos del sistema
(`~/.local/share/inventario-edumind`, `%APPDATA%\InventarioEDUmind` o
`~/Library/Application Support/InventarioEDUmind`). **Por qué:** los inventarios llevan
nombres, correos y DNI del profesorado y del alumnado prestatario; guardarlos fuera del
centro obligaría a tratamientos y encargados que un colegio no necesita. EDUmind no
recibe ningún dato. Los datos van fuera de la carpeta de la app para que no se pierdan al
actualizar (basta sustituir la carpeta).

## D2. Sin cuentas en la nube, sin tiendas de apps, sin analítica
No hay registro online ni telemetría. Los móviles y tablets usan el navegador y «Añadir a
pantalla de inicio». **Por qué:** evitar dependencias de terceros y cualquier salida de
datos; la app debe funcionar en centros con redes restrictivas y sin internet.

## D3. Dos modos: local (HTTP en 127.0.0.1) y red (HTTPS en la WiFi del centro)
Arranca en modo local, que funciona siempre. El modo red lo activa el administrador desde
*Sistema* y sirve por HTTPS con un certificado autofirmado generado con `selfsigned`.
**Por qué:** el navegador solo da acceso a la cámara (escaneo de QR) en contexto seguro,
y un certificado autofirmado es lo único viable sin dominio ni internet. El certificado se
regenera si cambia la IP del servidor.

## D4. Node.js empaquetado en `runtime/`
Cada paquete lleva su propio Node 22 y se abre con doble clic (`Iniciar Inventario.vbs`,
`iniciar-inventario.sh`, app de macOS). **Por qué:** «se descarga, se descomprime y se
abre», sin instalar nada ni pedir permisos de administrador; en Abalar solo se exige
glibc ≥ 2.28 (`comprobar-abalar.sh`).

## D5. Sesiones y roles
Cookie `edumind_session` HttpOnly, SameSite=Lax, 30 días, `Secure` solo en modo red;
contraseñas con scrypt y sal; roles consulta < gestor < admin; la copia de seguridad
(base de datos completa) exige rol admin. **Por qué:** el modo red expone el servidor a
toda la WiFi del centro, así que hace falta autenticación y permisos aunque sea local.
*Pendiente de revisar:* caducidad por inactividad de la sesión.

## D6. Etiquetas y actas
Etiquetas QR con el formato `EDUMIND1|CÓDIGO|CATEGORÍA` (sin datos personales) en
plantillas APLI 01274, 01287 y 01783; actas de préstamo/devolución en PDF con una
cláusula RGPD configurable por el centro. **Por qué:** los centros ya usan esas etiquetas
adhesivas, y el acta impresa es lo que firman las familias.

## D7. El service worker no cachea
Solo existe para permitir la instalación como PWA. **Por qué:** cachear provocaba ver datos
viejos del inventario.

## D8. Distribución por GitHub Releases con SHA-256, sin firma GPG
Los ZIP/`.deb`/`.dmg` no van al git (`.gitignore`); se publican como assets de la release
y la web de descargas muestra sus SHA-256. **Por qué:** los binarios pesan 35-49 MB y
cambian en cada versión. No hay firma GPG ni firma de código de Windows/macOS (de ahí
SmartScreen y el «clic derecho → Abrir»); se dice así en la web para no prometer lo que
no existe.

## D9. Windows se distribuye como ZIP con `Iniciar Inventario.vbs`, no como Setup.exe
Existe un `windows-installer-src/inventario.nsi` (NSIS) sin publicar. **Por qué:** un
instalador sin firmar no aporta nada frente al ZIP y añade avisos de SmartScreen. La
0.2.1 (2026-09-11) solo corrigió el arranque del `.vbs` dentro del ZIP sin extraer.

## D10. Los `.dmg` y `.deb` conservan el nombre 0.2.0 en la release 0.2.1
**Por qué:** su versión va escrita dentro del paquete (`dpkg-deb -f` la declara);
renombrarlos mentiría. Se vuelven a subir a cada release para que todos los enlaces de
la web funcionen.

## D11. El código fuente de la app vive en `app/` desde el 2026-11-03
Hasta esa fecha el repositorio solo contenía la web de descargas y la documentación, y el
fuente se entregaba bajo petición (Art. 13 AGPL). El fuente original no se conservó en
ningún repositorio ni en el servidor (ver D13), así que `app/` es una reconstrucción.

## D12. Doble licencia AGPL-3.0-or-later OR EUPL-1.2 (2026-09-26)
Se alinea con el resto de apps EDUmind: AGPL porque hay un componente servidor en red,
EUPL como alternativa europea con validez jurídica en las lenguas oficiales de la UE. La
marca EDUmind® queda fuera de la licencia (TRADEMARKS.md).

## D13. Reconstrucción del fuente a partir de los paquetes compilados (2026-11-03)
El proyecto SvelteKit original se compiló en un equipo ajeno al servidor y no se subió a
ningún repositorio: solo existían los ZIP/.deb/.dmg de 0.2.x. Tras buscar sin éxito en el
servidor, en GitHub (edumind-es y losmundosedufis), en las releases y en las transcripciones
de sesiones de Claude, se reconstruyó `app/` desde el build: la parte servidor
(`build/server/chunks`) es JavaScript legible y se pasó a TypeScript casi literal; las
pantallas Svelte se reescribieron a partir del HTML de la salida SSR y de la lógica del
cliente minificado. **Por qué:** sin fuente no se podían corregir los errores 500 de 0.2.x
ni evolucionar la app. **Qué se conserva:** rutas, esquema SQLite (`user_version` 1),
formato de QR `EDUMIND1|`, hash `scrypt$sal$hash`, cookie de sesión, zona de datos y los
scripts `server.mjs`/`run.mjs`/`admin.mjs`, por lo que una instalación 0.2.x se actualiza
sustituyendo la carpeta. **Lección:** `scripts/package.mjs` comprueba ahora que las
dependencias de producción están en `node_modules/` antes de cerrar cada paquete.
