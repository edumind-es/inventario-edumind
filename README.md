# Inventario EDUmind

**Inventario de recursos digitales para centros educativos.** Local-first y privacy-first:
los datos se guardan en el propio equipo del centro y **nunca salen de allí**. Sin cuentas en
la nube, sin servicios online, sin App Store ni Play Store.

> Versión actual: **0.2.1** · Software libre bajo doble licencia [AGPL-3.0-or-later](LICENSE-AGPL-3.0-or-later.txt) / [EUPL-1.2](LICENSE-EUPL-1.2.txt) · Autor: Luis Vilela Acuña · [Cambios](CHANGELOG.md) · [Decisiones](DECISIONES.md) · [Privacidad](PRIVACIDAD.md) · [Créditos](CREDITS.md)

---

## Qué es

Una aplicación para **crear y gestionar el inventario** de dispositivos y recursos digitales
de un colegio (tablets, portátiles, préstamos a alumnado, etiquetas QR, usuarios…), pensada
como **alternativa instalable a los programas online**. Se descarga, se descomprime y se abre
con doble clic: no requiere instalar servidores ni depender de internet.

- **Local-first** — toda la información vive en el ordenador del centro.
- **Modo red opcional** — desde ese ordenador puedes activar el «modo red» para que móviles y
  tablets se conecten por la WiFi del centro (con código QR), sin instalar nada en ellos.
- **Privacy-first (RGPD)** — EDUmind no recibe ni trata ningún dato del inventario.

## Descargar e instalar

Las descargas están en la sección **[Releases](../../releases)** (instaladores y ZIP para
Windows, macOS y Linux, incluido ARM / Raspberry Pi).

También puedes ver la **página de descargas** con instrucciones e integridad SHA-256 en
[`web/`](web/) (publicable con GitHub Pages).

Instalación resumida:

| Sistema | Cómo |
|---|---|
| 🍎 **macOS** | Abre el `.dmg`, arrastra la app a Aplicaciones. La 1ª vez: clic derecho → «Abrir». |
| 🪟 **Windows** | Descomprime el ZIP **completo** («Extraer todo») y haz doble clic en `Iniciar Inventario.vbs`. No hay instalador (`Setup.exe`). |
| 🐧 **Linux / Abalar** | `sudo dpkg -i inventario-edumind_*.deb`, o descomprime el ZIP y ejecuta `iniciar-inventario.sh`. |
| 📱 **iOS / Android** | No descargan nada: se conectan por navegador al ordenador del centro (modo red) y «Añadir a pantalla de inicio». |

**Verifica la integridad** con los códigos SHA-256 publicados en cada Release
(`SHA256SUMS.txt`) antes de instalar. No se publican firmas GPG. Los `.dmg` y `.deb` de la
release 0.2.1 conservan el nombre 0.2.0 porque son las mismas compilaciones (solo cambió el
ZIP de Windows).

> **Incidencia conocida en los paquetes 0.2.0/0.2.1** (detectada el 2026-09-25): a los cinco
> paquetes les faltan los módulos `qrcode`, `pdf-lib` y `papaparse` en `node_modules/`, y por
> eso la ficha de cada equipo, el préstamo, las etiquetas y actas en PDF, la importación CSV
> y la pantalla *Sistema* (modo red) devuelven un error 500. Se corregirá en el próximo
> empaquetado; mientras tanto, la app sirve para el alta y listado de equipos y usuarios.

## Primer arranque

Al abrirlo por primera vez pide crear la **cuenta de administración** y el nombre del centro.
A partir de ahí los datos se guardan en ese equipo y **no se pierden al actualizar**. Empieza
en modo local; para usarlo desde móviles/tablets, entra como administrador y activa el **modo
red** en *Sistema*.

## Privacidad

Local-first: nada sale del centro, sin analítica ni telemetría. Qué guarda la app, dónde,
cuánto tiempo y qué exporta: [PRIVACIDAD.md](PRIVACIDAD.md).

## Hecho con IA

Este recurso se ha desarrollado con vibe coding con asistencia de IA (Claude Code y ChatGPT).
Lo que ha comprobado el autor:

- La web de descargas se ha revisado con axe-core (Playwright/Chromium): sin violaciones de
  contraste ni de landmarks, sin desbordamiento horizontal a 375 px.
- Los SHA-256 de los cinco ZIP publicados coinciden con `web/SHA256SUMS.txt`
  (`sha256sum -c`).
- Las licencias del material de terceros se han revisado una a una (ver [CREDITS.md](CREDITS.md)).
- Los textos de la web y del README se han contrastado con lo que hacen realmente los
  paquetes publicados (evaluación VCER del 2026-09-25): se retiraron las afirmaciones
  falsas (`Setup.exe`, firma GPG) y se documenta la incidencia de los módulos que faltan.
- No hay pruebas automáticas ni CI en este repositorio: solo contiene HTML estático y
  documentación. La aplicación no se ha probado de forma automatizada.

Política de IA de EDUmind: https://edumind.es/es/legal/ia

## Cómo modificarlo

Este repositorio contiene la **web de descargas** (`web/`) y la **documentación**; la
aplicación se distribuye compilada en los paquetes de Releases.

- **Web de descargas:** `web/index.html` y `web/descargas.html` son HTML autocontenidos
  (CSS y JS en línea, sin dependencias). Para una versión nueva hay que actualizar a mano
  `web/version.json`, `web/installers.json`, `web/SHA256SUMS.txt`, la tabla y el objeto
  `DL` de `index.html`, la tabla de `descargas.html`, el `BASE` de los enlaces
  (`releases/download/vX.Y.Z/`) y este README. Se puede probar en local con
  `python3 -m http.server -d web`.
- **Aplicación (SvelteKit + Node 22):** el código fuente completo se entrega a quien lo
  solicite en `contacto@edumind.es` (Art. 13 AGPL) mientras no esté publicado aquí. Los
  paquetes llevan el servidor compilado en `build/`, los lanzadores en `scripts/`
  (`server.mjs`, `run.mjs`, `paths.mjs`, `admin.mjs`, con comentarios en español) y Node en
  `runtime/`. Se arranca con `runtime/bin/node --experimental-sqlite scripts/server.mjs`
  (`EDUMIND_MODE=local|red`, `PORT`, `EDUMIND_DB_PATH` para usar otra base de datos).
- **Servicios opcionales:** no hay ninguno; la app no llama a internet.
- **Documentos:** `DECISIONES.md` (por qué es como es), `CHANGELOG.md` (qué cambió),
  `PRIVACIDAD.md`, `CREDITS.md`.

## Licencia

Doble licencia, a elección de quien recibe el software: **AGPL-3.0-or-later** o **EUPL-1.2**
— ver [LICENSE](LICENSE) (resumen), [LICENSE-AGPL-3.0-or-later.txt](LICENSE-AGPL-3.0-or-later.txt),
[LICENSE-EUPL-1.2.txt](LICENSE-EUPL-1.2.txt), [NOTICE](NOTICE), [AUTHORS](AUTHORS),
[COPYRIGHT](COPYRIGHT) y [CREDITS.md](CREDITS.md).

El código es libre; la marca **EDUmind®** es propiedad de Luis Vilela Acuña y no se cede con
el código ([TRADEMARKS.md](TRADEMARKS.md)).

> **Nota sobre el código fuente:** conforme al Art. 13 de la AGPL-3.0, el código fuente
> completo correspondiente a la versión distribuida se ofrece a cualquier usuario que lo
> solicite en `contacto@edumind.es`. Está pendiente publicarlo en este repositorio.

---

© 2024-2026 Luis Vilela Acuña · EDUmind®
