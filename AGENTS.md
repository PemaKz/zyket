# AGENTS.md — Zyket Framework Reference

> A complete, accurate reference for AI agents building applications with **Zyket**.
> Zyket is a service-oriented Node.js framework (Express 5 + Socket.IO + better-auth + Sequelize/BullMQ/MinIO) inspired by Symfony's architecture. Components are auto-discovered from the filesystem; services are wired through a dependency-injection container.

This document is the source of truth. When an installed copy exists, read `node_modules/zyket/AGENTS.md`. Always confirm a base class API against the installed source before relying on it.

---

## 1. Quick start

```bash
mkdir my-app && cd my-app
npm install zyket
npx zyket init                 # interactive: pick a template
# or non-interactive:
npx zyket init api-rest        # default | api-rest | saas-multitenant | realtime-chat
```

`init` scaffolds the chosen template's files, generates a `.env` (defaults merged with the template's `.env.example`), writes a `package.json` with the right dependencies, and runs `npm install`. Templates that ship auth need their tables created once:

```bash
npx @better-auth/cli migrate
node index.js
```

Minimal manual boot:

```js
// index.js
const { Kernel } = require("zyket");

const kernel = new Kernel({
  services: [
    ["auth", require("./src/services/auth"), ["@service_container"]],
  ],
});

kernel.boot().then(() => console.log("Booted")).catch(console.error);
```

---

## 2. The Kernel

```js
new Kernel({ services: [], extensions: [] })
kernel.boot(clearConsole = true, secretsPath = "<cwd>/.env")
```

Boot order:
1. Load `.env` (creates one with defaults if missing).
2. Start the HTTP server on `PORT` (default 3000).
3. Register **core services** (auto-selected from env, see §4) then your `services`.
4. Call `boot({ httpServer })` on every service in order.
5. Load each `extensions` instance via `extension.load(container)` (after services).

`kernel.container` exposes the DI container (`container.get('name')`, `container.has('name')`).

**Service registration tuple:** `[name, ClassOrFactory, args]`. Special arg placeholders:

| Placeholder | Injected value |
|-------------|----------------|
| `"@service_container"` | the DI container |
| `"@onConnection"` | the kernel's socket-connection callback |

Auth is **not** a core service — register it yourself (templates do).

---

## 3. Environment variables

The generated `.env` (`src/utils/EnvManager.js`) plus auth/vite variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DEBUG` | `true` | Enable debug-level logs |
| `PORT` | `3000` | HTTP/WS port |
| `NODE_ENV` | — | `production` enables secure cookies, Vite preview build |
| `HTTP_JSON_LIMIT` | `10mb` | Express JSON body limit |
| `SOCKET_MAX_HTTP_BUFFER_SIZE` | `10485760` | Socket.IO max payload bytes |
| `DISABLE_EXPRESS` | `false` | Turn off the HTTP/REST service |
| `DISABLE_SOCKET` | `true` | Turn off Socket.IO |
| `DISABLE_VITE` | `true` | Turn off the Vite frontend |
| `DISABLE_EVENTS` | `true` | Turn off the events service |
| `DISABLE_BULLMQ` | `true` | Turn off BullMQ queues/workers |
| `DISABLE_SCHEDULER` | `true` | Turn off the cron scheduler |
| `DISABLE_LOGGER` | `false` | Silence the logger |
| `DISABLE_SWAGGER` | — | `true` removes the `/docs` UI |
| `SWAGGER_PASSWORD` / `SWAGGER_USER` | — / `admin` | HTTP Basic auth for `/docs` |
| `SWAGGER_PATH` | `/docs` | Swagger UI mount path |
| `DATABASE_URL` | `./database.sqlite` | DB connection / sqlite path. Activates the `database` service when set |
| `DATABASE_DIALECT` | `sqlite` | `sqlite`, `postgresql`, `mariadb`… (auth supports only `sqlite`/`postgresql`) |
| `CACHE_URL` | `` | `redis://…` for Redis, empty/`memory` for in-memory |
| `REDIS_URL` | — | Enables the Socket.IO Redis adapter (multi-instance) |
| `S3_ENDPOINT` `S3_PORT` `S3_USE_SSL` `S3_ACCESS_KEY` `S3_SECRET_KEY` | — | MinIO/S3. The `s3` service activates when endpoint+keys are set |
| `S3_PUBLIC_BUCKETS` / `S3_PRIVATE_BUCKETS` | — | Comma lists; public buckets get a read-all policy |
| `LOG_DIRECTORY` | `./logs` | Log file directory |
| `QUEUES` | `` | Comma list of BullMQ queue names to create |
| `VITE_ROOT` | `./frontend` | Frontend project root |
| `VITE_PORT` | `5173` | Vite dev/preview port |
| `VITE_API_BASE` | `http://localhost:3000` | Frontend → backend base URL |
| **Auth** (added by the auth service) | | |
| `AUTH_SECRET` | random 32-byte hex | Session signing secret. **Boot fails if missing/insecure** |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Public base URL of the auth server |
| `TRUSTED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma list of allowed origins (CORS + CSRF) |
| `AUTH_CROSS_DOMAIN` | `false` | `true` → cross-site cookies (`sameSite=none; secure`, needs HTTPS) |
| `BULLBOARD_ADMIN_PASSWORD` | — | Required to expose the BullBoard dashboard extension |

---

## 4. Services

Core services are auto-registered based on env (`src/services/index.js`). Access any with `container.get('<name>')`.

| Name | Activated when | Key API |
|------|----------------|---------|
| `logger` | always (silent if `DISABLE_LOGGER=true`) | `info/warn/error/debug(msg)` |
| `template-manager` | always | internal (templates) |
| `events` | `DISABLE_EVENTS !== 'true'` | `emit(name, payload)`, `emitAsync(name, payload, timeout)` |
| `database` | `DATABASE_URL` set | `models`, `sequelize`, `Op`, `Sequelize`, `sync()`, `runMigrations(path)`, `loadModel(fn)` |
| `cache` | always | `get/set/del/keys/expire`, `client` (redis or null) |
| `s3` | `S3_ENDPOINT` + access + secret | `saveFile/getFile/removeFile/ensureBucket/listBuckets`, `client` (MinIO) |
| `scheduler` | `DISABLE_SCHEDULER !== 'true'` | discovers `src/schedulers/*` |
| `bullmq` | `DISABLE_BULLMQ !== 'true'` | `queues`, `addJob(queue, name, data, opts, waitForCompletion)` |
| `socketio` | `DISABLE_SOCKET !== 'true'` | `io`, `sockets` |
| `vite` | `VITE_ROOT` set + `DISABLE_VITE !== 'true'` | serves `frontend/` |
| `express` | `DISABLE_EXPRESS !== 'true'` | `app()`, `registerRoutes(routes)`, `regiterRawAllRoutes(path, handler)` |
| `auth` | **manual registration** | `client` (better-auth), `getSession(headers)` |

> Note: `bullmq`, `scheduler`, `events` default to ON when their `DISABLE_*` var is absent, but the generated `.env` ships them as `true` (off). Set the relevant `DISABLE_*=false` to enable.

### Custom service

```js
const { Service } = require("zyket");

module.exports = class MyService extends Service {
  #container;
  constructor(container) { super("my-service"); this.#container = container; }
  async boot({ httpServer } = {}) { /* init */ }
  doThing() { /* ... */ }
};
```

Register: `services: [["my-service", MyService, ["@service_container"]]]`.

---

## 5. Auto-discovered components

These are discovered from folders under `src/` — the **filename is the identity**. Use kebab-case, `module.exports = class extends Base`, and do not add constructor params (the loader passes only the derived name).

| Component | Folder | Base | Identity from filename |
|-----------|--------|------|------------------------|
| Route | `src/routes/` | `Route` | URL path |
| Middleware | `src/middlewares/` | `Middleware` | referenced manually |
| Handler | `src/handlers/` | `Handler` | socket event name |
| Guard | `src/guards/` | `Guard` | guard name |
| Event | `src/events/` | `Event` | event name |
| Scheduler | `src/schedulers/` | `Schedule` | label |
| Worker | `src/workers/` | `Worker` | label |
| Model | `src/models/` | factory fn | model name |

### Routes (`src/routes/**.js`)

File path → URL: `index.js`→`/`, `users.js`→`/users`, `users/[id].js`→`/users/:id`. Methods: **`get`, `post`, `put`, `delete`** (PATCH is not dispatched).

```js
const { Route, RequireAuthMiddleware } = require("zyket");

module.exports = class extends Route {
  middlewares = { post: [new RequireAuthMiddleware()] }; // per-method

  async get({ container, request, response }) {
    return { items: [] };                 // → { success: true, items: [] }
  }
  async post({ container, request }) {
    if (!request.body.name) return { success: false, message: "name required", status: 400 };
    return { created: true, status: 201 };
  }
};
```

Return conventions: object → `{ success: true, ...obj }` JSON; `status` key sets HTTP code; `Buffer` → file download; `new RedirectResponse(url)` → redirect. Thrown errors → `500 { success:false, message:"Internal Server Error" }` (details only in logs).

### Middlewares (`src/middlewares/*.js`)

```js
const { Middleware } = require("zyket");
module.exports = class extends Middleware {
  async handle({ container, request, response, next }) {
    // respond to block, or call next() to continue
    next();
  }
};
```

### Socket.IO handlers (`src/handlers/*.js`) & guards (`src/guards/*.js`)

```js
// src/handlers/message.js  → listens to the "message" event
const { Handler } = require("zyket");
module.exports = class extends Handler {
  guards = ["auth"];                       // run before handle; throw to block
  async handle({ container, socket, data, io }) {
    io.to("room").emit("message", data);
    return { ok: true };                   // returned to the client ack callback
  }
};
```

```js
// src/guards/auth.js
const { Guard } = require("zyket");
module.exports = class extends Guard {
  async handle({ container, socket, io }) {
    if (!ok) throw new Error("Unauthorized"); // blocks the event
  }
};
```

> `connection.js` is special (runs on connect). **Connection-level guards are not awaited and do not reliably block** — enforce connect-time auth inside `connection.js` itself (throwing there disconnects the socket).

### Events (`src/events/*.js`)

```js
const { Event } = require("zyket");
module.exports = class extends Event {
  async handle({ container, payload }) { /* ... */ }
};
// elsewhere: container.get('events').emit('user-registered', { id })
```

### Scheduler (`src/schedulers/*.js`)

```js
const { Schedule } = require("zyket");
module.exports = class extends Schedule {
  time = "*/5 * * * *";                    // node-cron expression
  async handle({ container }) { /* ... */ }
};
```

### Worker (`src/workers/*.js`) — BullMQ

```js
const { Worker } = require("zyket");
module.exports = class extends Worker {
  queueName = "emails";                    // must match a name in QUEUES
  instances = 1;                           // number | array | async fn
  options = { concurrency: 5 };            // BullMQ worker options | fn
  async handle({ container, job, instance, index }) { /* process job.data */ }
};
// enqueue: container.get('bullmq').addJob('emails', 'welcome', { to })
```

### Model (`src/models/*.js`) — Sequelize factory

```js
module.exports = ({ sequelize, Sequelize, container }) => {
  const User = sequelize.define("User", {
    email: { type: Sequelize.STRING, allowNull: false },
  });
  User.associate = (models) => { /* User.hasMany(models.Post) */ };
  return User;
};
// access: container.get('database').models.User ; create tables: .sync()
```

---

## 6. Authentication (better-auth)

The `auth` service mounts better-auth at `/api/auth/*` and provides sessions, the **admin** plugin, the **bearer** plugin, and (optionally) the **organization** plugin. Customize by subclassing `AuthService`:

```js
const { AuthService } = require("zyket");

module.exports = class CustomAuthService extends AuthService {
  get organizationEnabled() { return true; }        // multi-tenant
  get requireEmailVerification() { return false; }
  get plugins() { return []; }                       // extra better-auth plugins
  get socialProviders() { return {}; }
  get userAdditionalFields() { return {}; }
  get organizationAdditionalFields() { return {}; }
  async allowUserToCreateOrganization(user) { return true; }
  async sendVerificationEmail({ user, url, token }) { /* email */ }
  async sendResetPasswordEmail({ user, url, token }) { /* email */ }
  async sendInvitationEmail(data) { /* org invite */ }
};
```

Requirements: `DATABASE_DIALECT` must be `sqlite` or `postgresql`. Run `npx @better-auth/cli migrate` to create auth tables (it reads `src/services/auth/auth.js`).

### Protecting routes & sockets

| Helper | Use |
|--------|-----|
| `RequireAuthMiddleware` | route middleware; requires a session. `new RequireAuthMiddleware(['admin'])` to gate by role. Sets `request.user` / `request.session` |
| `RequireAdminMiddleware` | route middleware; requires `role === 'admin'` |
| `AuthGuard` | socket guard; rejects events without a session. Use `module.exports = require('zyket').AuthGuard` in `src/guards/auth.js` |
| `container.get('auth').getSession(headers)` | resolve a session from raw headers (e.g. `socket.handshake.headers`) without importing better-auth |

### Cookies (environment-aware)

Default: `sameSite=lax`, `secure` only in production → works over `http://localhost` when frontend (`:5173`) and API (`:3000`) are same-site. For front/back on **different domains**, set `AUTH_CROSS_DOMAIN=true` (HTTPS required) → `sameSite=none; secure` + cross-subdomain cookies.

### Frontend auth client

```js
import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export const client = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_BASE || "http://localhost:3000"}/api/auth/`,
  plugins: [organizationClient(), adminClient()],
});
```

---

## 7. Extensions

Post-boot plugins with full container access. Register instances in the Kernel.

```js
const { Kernel, BullBoardExtension, InteractiveStorageExtension } = require("zyket");

new Kernel({
  extensions: [
    new BullBoardExtension({ path: "/bullboard", middlewares: [] }),        // needs BULLBOARD_ADMIN_PASSWORD or middlewares, else it won't mount
    new InteractiveStorageExtension({ path: "/storage", bucketName: "dropbox", middlewares: [/* auth */], maxDeleteBatch: 100 }),
  ],
});
```

Custom extension:

```js
const { Extension } = require("zyket");
module.exports = class extends Extension {
  constructor(options = {}) { super("MyExtension"); this.options = options; }
  async load(container) {
    if (!container.get("express")) return container.get("logger").warn("no express");
    container.get("express").registerRoutes([/* Route instances */]);
  }
};
```

---

## 8. Frontend (Vite + React)

When `VITE_ROOT` is set and `DISABLE_VITE=false`, Zyket runs Vite (dev server, or a built preview server in production) for the `frontend/` app. Stack: React 19 + react-router-dom + zustand + Tailwind v4 + better-auth client. The frontend talks to the backend at `VITE_API_BASE`. A project with a frontend must declare its own frontend dependencies (the CLI does this automatically per template).

---

## 9. Templates

| Template | Stack | Use for |
|----------|-------|---------|
| `default` | backend + (optional) React frontend | general starter |
| `api-rest` | backend only, auth + CRUD (`Task`) | clean REST APIs |
| `saas-multitenant` | orgs/roles + React dashboard, tenant-scoped `Project` | multi-tenant SaaS |
| `realtime-chat` | Socket.IO + React chat UI, session auth | real-time apps |

Each template is self-contained (`index.js`, `.env.example`, `README.md`, and frontend where relevant). `npx zyket init <template>` scaffolds it.

---

## 10. CLI

```bash
npx zyket                       # interactive menu
npx zyket init                  # choose a template, scaffold + install + (default) run
npx zyket init <template>       # scaffold a specific template
```

`init` keeps existing files (non-destructive). For non-default templates it prints next steps (auth migrate + run) instead of auto-starting.

---

## 11. Security checklist

See `SECURITY.md` for the full audit. Essentials before production:

- Keep `.env` out of git; never reuse `AUTH_SECRET` (it's generated per project; boot fails on a known/empty value).
- Protect every non-public route/socket with `RequireAuthMiddleware` / `AuthGuard`.
- Set `BULLBOARD_ADMIN_PASSWORD` (or pass `middlewares`) — the dashboard won't mount without auth.
- Set `SWAGGER_PASSWORD` (or `DISABLE_SWAGGER=true`) in production.
- Lock `TRUSTED_ORIGINS`; set `AUTH_CROSS_DOMAIN=true` only for real cross-domain HTTPS deployments.
- Add rate limiting and `helmet` (not bundled).
- For the storage extension, always pass auth `middlewares`; tune `maxFileSize` / `maxDeleteBatch`.

---

## 12. Build-a-feature recipe

1. **Model** — `src/models/Thing.js` (Sequelize factory). Create tables with `container.get('database').sync()` in `index.js` after boot, or migrations.
2. **Routes** — `src/routes/things/index.js` (GET list, POST create) and `src/routes/things/[id].js` (GET/PUT/DELETE). Gate with `new RequireAuthMiddleware()`.
3. **Access data** — `const { Thing } = container.get('database').models;`.
4. **Realtime (optional)** — `src/handlers/<event>.js` with `guards = ["auth"]`; broadcast with `io`.
5. **Background (optional)** — add the queue to `QUEUES`, `DISABLE_BULLMQ=false`, add `src/workers/<name>.js`, enqueue with `container.get('bullmq').addJob(...)`.
6. **Run** — `npx @better-auth/cli migrate` (first time) then `node index.js`.

To scaffold any component quickly, use the `generate` skill (`/zyket:generate route things/[id]`).
