# Seguridad — Zyket

Auditoría de seguridad del framework y estado de las correcciones.
Leyenda: `[x]` hecho · `[ ]` pendiente · 🔴 crítico · 🟠 alto · 🟡 medio · 🔵 bajo

---

## ✅ Resuelto

- [x] 🔴 **`.env` ignorado en git.** Añadido `.env` / `*.sqlite` al `.gitignore` para evitar fuga de `AUTH_SECRET`, claves S3 y credenciales de BD.
- [x] 🔴 **`AUTH_SECRET` aleatorio + fail-closed.** `#addAuthEnvVariables` genera ahora un secreto con `crypto.randomBytes(32)` por proyecto y lo inyecta en `process.env` para el primer arranque. `#requireAuthSecret()` aborta el boot si el secreto falta o es uno de los valores estáticos conocidos. → [src/services/auth/index.js](src/services/auth/index.js)
- [x] 🔴 **Autenticación en Storage realmente aplicada.** Antes los `middlewares` del constructor se guardaban pero no se usaban; ahora se aplican a todas las rutas y métodos (auth antes de multer en `upload`). La autenticación se inyecta vía `new InteractiveStorageExtension({ middlewares: [authMiddleware] })`. → [src/extensions/interactive-storage/index.js](src/extensions/interactive-storage/index.js)
- [x] 🔴 **BullBoard fail-closed.** Si no hay `BULLBOARD_ADMIN_PASSWORD` ni `middlewares`, el panel **no se monta** (antes quedaba público). Soporta `middlewares` por constructor. → [src/extensions/bullboard/index.js](src/extensions/bullboard/index.js)
- [x] 🟠 **Inyección de cabecera en descarga.** `Content-Disposition` ahora sanea el nombre (basename + ASCII filtrado + `filename*=UTF-8''`) evitando breakout de comillas/CRLF. → [src/extensions/interactive-storage/routes/download.js](src/extensions/interactive-storage/routes/download.js)
- [x] 🟠 **Path traversal en `normalizePath`.** Se eliminan segmentos `..` / `.` además de normalizar slashes. → [src/extensions/interactive-storage/index.js](src/extensions/interactive-storage/index.js#L150)
- [x] 🟡 **Límite en borrado masivo.** `delete` ahora rechaza lotes mayores a `maxDeleteBatch` (por defecto 100, configurable en el constructor de la extensión) → evita borrado masivo / agotamiento de recursos en una sola petición. → [src/extensions/interactive-storage/routes/delete.js](src/extensions/interactive-storage/routes/delete.js)
- [x] 🟡 **`requireEmailVerification` personalizable.** Nuevo getter `requireEmailVerification` (por defecto `false`, manteniendo el comportamiento previo) sobreescribible al extender `AuthService`. → [src/services/auth/index.js](src/services/auth/index.js#L71)
- [x] 🟡 **Límite en borrado de carpeta.** `delete-folder` rechaza prefijos con más de `maxDeleteBatch` archivos (mismo tope configurable que `delete`). → [src/extensions/interactive-storage/routes/delete-folder.js](src/extensions/interactive-storage/routes/delete-folder.js)
- [x] 🟠 **Validación de `fileName` en `download`/`info`.** Se rechazan (`400`) claves con segmentos `..`/`.`, backslashes o que empiecen por `/` antes de llegar al cliente S3. → [download.js](src/extensions/interactive-storage/routes/download.js), [info.js](src/extensions/interactive-storage/routes/info.js)
- [x] 🟡 **Límites de payload configurables (default 10 MB).** Body JSON vía `HTTP_JSON_LIMIT` y socket vía `SOCKET_MAX_HTTP_BUFFER_SIZE` (ambos por defecto 10 MB, incluidos en el `.env` generado). → [Express.js](src/services/express/Express.js#L32), [SocketIO.js](src/services/socketio/SocketIO.js#L32), [EnvManager.js](src/utils/EnvManager.js)
- [x] 🟡 **Swagger protegible opcionalmente.** `SWAGGER_PASSWORD` activa HTTP Basic auth (usuario configurable con `SWAGGER_USER`, default `admin`); `DISABLE_SWAGGER=true` lo desactiva por completo. Si queda abierto se emite un warning. → [src/services/express/Express.js](src/services/express/Express.js#L44)
- [x] 🟡 **No se filtra `error.message` al cliente.** Las 4 respuestas `500` (rutas y middlewares, en `boot` y `registerRoutes`) devuelven ahora un genérico `Internal Server Error`; el detalle (incluido el stack) queda solo en los logs del servidor. → [src/services/express/Express.js](src/services/express/Express.js)
- [x] 🟠 **Cookies dependientes del entorno.** Ya no se fuerza `sameSite:"none"` + `secure` + cross-subdomain siempre. Por defecto `sameSite:"lax"` y `secure` solo en producción (login funciona en `http://localhost`); `AUTH_CROSS_DOMAIN=true` activa `none`+`secure`+cross-subdomain para front/back en dominios distintos (HTTPS). → [src/services/auth/index.js](src/services/auth/index.js#L126-L165)
- [x] 🟢 **Helpers de autorización en el framework.** Nuevos `RequireAuthMiddleware`, `RequireAdminMiddleware` (rutas) y `AuthGuard` (sockets), exportados desde `zyket`, para proteger rutas/eventos con la sesión de better-auth. → [src/services/express/RequireAuthMiddleware.js](src/services/express/RequireAuthMiddleware.js), [src/services/socketio/AuthGuard.js](src/services/socketio/AuthGuard.js)

---

## ⏳ Pendiente

### 🟠 Alto
- [ ] **CSRF de OAuth / account linking.** `account.skipStateCookieCheck: true` junto a `accountLinking.enabled: true` desactiva la verificación de `state` → riesgo de account takeover. Quitar `skipStateCookieCheck`. → [src/services/auth/index.js](src/services/auth/index.js#L189-L191)
- [ ] **Socket.IO CORS `origin:"*"` + guard por defecto que no bloquea.** Restringir origins (reutilizar `TRUSTED_ORIGINS`) y que el guard por defecto deniegue sin sesión válida. → [src/services/socketio/SocketIO.js](src/services/socketio/SocketIO.js#L32), [src/templates/default/src/guards/default.js](src/templates/default/src/guards/default.js)

### 🟡 Medio
- [ ] **Rate limiting** (login, reset password, upload) con `express-rate-limit`. → [src/services/express/Express.js](src/services/express/Express.js)
- [ ] **Cabeceras de seguridad** con `helmet`. → [src/services/express/Express.js](src/services/express/Express.js)

### 🔵 Bajo / Higiene
- [ ] **Reducir superficie de drivers de BD** (`sqlite3` + `better-sqlite3` + `pg` + `mariadb`).
- [ ] **Documentar guía de despliegue seguro** (variables obligatorias en producción, HTTPS, secretos).
