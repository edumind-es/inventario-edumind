# Privacidad — Inventario EDUmind

Resumen verificable de qué datos maneja la aplicación distribuida (0.2.x) y la web de
descargas, dónde se guardan y con quién se comunican. EDUmind no recibe ningún dato.

## Qué guarda la aplicación y dónde

Todo se guarda en un único fichero SQLite, `inventario.db`, en el ordenador donde se
ejecuta la app (el «servidor» del centro), fuera de la carpeta del programa:

| Sistema | Carpeta de datos |
|---|---|
| Linux / Abalar | `~/.local/share/inventario-edumind/` |
| Windows | `%APPDATA%\InventarioEDUmind\` |
| macOS | `~/Library/Application Support/InventarioEDUmind/` |

| Datos | Quién los introduce | Tabla |
|---|---|---|
| Nombre del centro, nombre, correo y contraseña de la persona administradora (scrypt + sal) | configuración inicial | `users`, `settings` |
| Usuarios: nombre, identificador/DNI, correo, rol, contraseña opcional, permisos de préstamo | administración, o importación CSV | `users` |
| Préstamos: persona prestataria (o nombre libre), quién lo registra, fechas, notas | gestores | `loans` |
| Equipos, categorías, ubicaciones, estado | gestores | tablas de inventario |
| Logo del centro (imagen ≤ 700 KB) | administración | `settings` |
| Sesiones: token aleatorio, 30 días | automático al entrar | `sessions` |

En el **navegador** solo queda la cookie de sesión `edumind_session` (HttpOnly, SameSite=Lax,
`Secure` en modo red). No se usa `localStorage` ni `IndexedDB` para datos del inventario.

## Cuánto tiempo

Los datos permanecen hasta que el centro los borra desde la app o elimina la carpeta de
datos. Las sesiones caducan a los 30 días. Las copias de seguridad que descargue la
persona administradora quedan bajo su custodia.

## Qué sale del programa (solo a petición de la persona usuaria)

- **Copia de seguridad** (solo admin): la base de datos completa, como fichero `.db`.
- **Acta de préstamo/devolución** (PDF): nombre y DNI de la persona responsable, equipo,
  fechas y la cláusula RGPD que configure el centro.
- **Etiquetas QR** (PDF): solo código de equipo y categoría; sin datos personales.

## Con qué se comunica

- **Modo local (por defecto):** escucha solo en `127.0.0.1:4600` por HTTP. Nada sale del
  ordenador.
- **Modo red:** escucha en la red local por HTTPS con certificado autofirmado. Los datos
  viajan únicamente por la WiFi del centro entre los dispositivos y el ordenador servidor.
- No hay ninguna conexión a internet, ni analítica, ni telemetría, ni actualizaciones
  automáticas.

## Web de descargas (edumind.es / GitHub)

Página estática sin cookies ni analítica. Las descargas se sirven desde GitHub Releases
(o desde edumind.es); el único enlace externo es la política de privacidad general de
EDUmind: https://edumind.es/es/legal/privacidad

## Responsabilidad

El centro que instala la app es responsable del tratamiento de los datos que introduce
(RGPD (UE) 2016/679 y LOPDGDD 3/2018). Recomendaciones: activar el modo red solo cuando
haga falta, usar contraseñas distintas por persona, revisar la cláusula RGPD por defecto
de las actas antes de imprimirlas y guardar las copias de seguridad en un lugar protegido.
