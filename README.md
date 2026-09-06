# Inventario EDUmind

**Inventario de recursos digitales para centros educativos.** Local-first y privacy-first:
los datos se guardan en el propio equipo del centro y **nunca salen de allí**. Sin cuentas en
la nube, sin servicios online, sin App Store ni Play Store.

> Versión actual: **0.2.0** · Software libre bajo licencia [AGPL-3.0](LICENSE)

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
| 🪟 **Windows** | Ejecuta el `Setup.exe` o descomprime el ZIP y abre el acceso directo. |
| 🐧 **Linux / Abalar** | `sudo dpkg -i inventario-edumind_*.deb`, o descomprime el ZIP y ejecuta `iniciar-inventario.sh`. |
| 📱 **iOS / Android** | No descargan nada: se conectan por navegador al ordenador del centro (modo red) y «Añadir a pantalla de inicio». |

**Verifica la integridad** con los códigos SHA-256 publicados en cada Release
(`SHA256SUMS.txt`) antes de instalar.

## Primer arranque

Al abrirlo por primera vez pide crear la **cuenta de administración** y el nombre del centro.
A partir de ahí los datos se guardan en ese equipo y **no se pierden al actualizar**. Empieza
en modo local; para usarlo desde móviles/tablets, entra como administrador y activa el **modo
red** en *Sistema*.

## Licencia

Distribuido bajo **GNU AGPL-3.0** — ver [LICENSE](LICENSE), [NOTICE](NOTICE),
[AUTHORS](AUTHORS) y [COPYRIGHT](COPYRIGHT).

El código es libre; la marca **EDUmind®** es propiedad de Luis Vilela Acuña y no se cede con el código.

> **Nota sobre el código fuente:** conforme al Art. 13 de la AGPL-3.0, este repositorio
> publica la aplicación y su distribución. El código fuente completo correspondiente a la
> versión de red se ofrece a cualquier usuario que lo solicite en `contacto@edumind.es`.
