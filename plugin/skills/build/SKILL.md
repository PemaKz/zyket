---
name: build
description: Build, configure, and run applications with the Zyket framework — start a project from a template, enable services, wire authentication, secure the app, and add features. Use whenever the user wants to use Zyket, create or set up a Zyket project/app, or understand how Zyket works. For scaffolding a single component, use the `generate` skill instead.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Build with Zyket

Use this skill to take a user from zero to a running Zyket application, or to extend an existing one. Zyket is a service-oriented Node.js framework (Express 5 + Socket.IO + better-auth + Sequelize/BullMQ/MinIO) with filesystem auto-discovery and a DI container.

## Golden rules

1. **Read the reference.** After install, the full, authoritative API lives in `node_modules/zyket/AGENTS.md`. Read it before relying on any API; confirm base classes against `node_modules/zyket/` source. Do not invent APIs.
2. **Filename = identity.** Routes, handlers, guards, events, schedulers, workers, and models are auto-discovered from `src/<folder>/`; the filename determines the URL/event/name. Use kebab-case and `module.exports = class extends Base`. Never add constructor params to these.
3. **Services activate from `.env`.** A feature that needs sockets/queues/db must have the matching `DISABLE_*=false` / `DATABASE_URL` set.
4. **Secure by default.** Protect non-public routes/sockets with `RequireAuthMiddleware` / `AuthGuard`. Never weaken cookie/auth settings to "make it work" — use `AUTH_CROSS_DOMAIN` instead.

## Workflow

### A. Starting a new project

1. **Pick a template** by intent:

   | User wants… | Template |
   |-------------|----------|
   | A clean REST API | `api-rest` |
   | Multi-tenant SaaS (orgs, roles, dashboard) | `saas-multitenant` |
   | Real-time / chat / live updates | `realtime-chat` |
   | A general starter / unsure | `default` |

2. **Scaffold:**
   ```bash
   npm install zyket
   npx zyket init <template>
   ```
   This copies the template, merges its `.env.example` onto sensible defaults, writes `package.json` with the right dependencies, and installs them.

3. **If the template uses auth** (`src/services/auth` exists), create the tables once:
   ```bash
   npx @better-auth/cli migrate --config src/services/auth/auth.js
   ```

4. **Run:** `node index.js`. The API is on `PORT` (3000); a frontend, if any, on `VITE_PORT` (5173).

### B. Enabling a capability in an existing project

Flip the env flag, then add the component. Confirm details in `AGENTS.md §3–4`.

| Capability | `.env` | Then add |
|-----------|--------|----------|
| HTTP routes | `DISABLE_EXPRESS=false` | `src/routes/**.js` |
| Real-time | `DISABLE_SOCKET=false` | `src/handlers/*.js`, `src/guards/*.js` |
| Database | `DATABASE_URL=...`, `DATABASE_DIALECT=...` | `src/models/*.js` |
| Background jobs | `DISABLE_BULLMQ=false`, `QUEUES=emails` | `src/workers/*.js` |
| Cron | `DISABLE_SCHEDULER=false` | `src/schedulers/*.js` |
| Cache | `CACHE_URL=redis://…` (or in-memory) | use `container.get('cache')` |
| Object storage | `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | use `container.get('s3')` |
| Frontend | `DISABLE_VITE=false`, `VITE_ROOT=./frontend` | `frontend/` React app |

### C. Adding authentication

1. Register the auth service in `index.js`: `["auth", require("./src/services/auth"), ["@service_container"]]`.
2. Subclass `AuthService` (see `AGENTS.md §6`) to set `organizationEnabled`, `requireEmailVerification`, email senders, etc.
3. Require `DATABASE_DIALECT` = `sqlite` or `postgresql`; run `npx @better-auth/cli migrate --config src/services/auth/auth.js`.
4. Protect routes with `new RequireAuthMiddleware()` (or `['admin']` / `RequireAdminMiddleware`) and sockets with the `AuthGuard` (`module.exports = require('zyket').AuthGuard` in `src/guards/auth.js`; enforce connect-time auth inside `src/handlers/connection.js` via `container.get('auth').getSession(socket.handshake.headers)`).

### D. Building a feature (recipe)

1. Model → `src/models/Thing.js` (Sequelize factory). Create tables with `container.get('database').sync()` after boot, or migrations.
2. Routes → `src/routes/things/index.js` (GET/POST) and `src/routes/things/[id].js` (GET/PUT/DELETE), gated by `RequireAuthMiddleware`.
3. Read data via `container.get('database').models.Thing`.
4. Optional realtime/jobs per the table in B.
5. Run and verify.

Delegate individual component scaffolding to the **`generate`** skill (e.g. `/zyket:generate route things/[id]`).

## Common pitfalls

- **PATCH routes don't dispatch** — only `get/post/put/delete` methods are wired.
- **Connection guards don't block** — do connect-time auth inside `connection.js` (throw to disconnect).
- **`bullmq`/`scheduler`/`events` default ON when the `DISABLE_*` var is absent**, but the generated `.env` ships them as `true`. Set them to `false` explicitly to enable.
- **Auth fails to boot** if `AUTH_SECRET` is missing or a known placeholder — let the framework generate it (it lands in `.env` when the file is created).
- **`better-auth migrate` says "No configuration file found"** — the CLI only auto-discovers `auth.js` under `src/{auth,lib,server,utils}/`, never under `src/services/`. Always pass `--config src/services/auth/auth.js`.
- **Frontend can't resolve `vite`/`react`/`better-auth`** — the project (not just zyket) must declare those deps; `npx zyket init` does this automatically for templates with a frontend.
- **Boot crashes with `Cannot read properties of undefined (reading 'BarBarToken')`** — a TypeScript 7 got hoisted into the tree, which `node-dependency-injection`'s bundled `typescript-estree@5` can't read. Zyket pins `typescript` to `^5` and `npx zyket init` writes a matching `overrides` block; on a project predating that, add `"overrides": { "typescript": "^5.9.3" }` to `package.json` and reinstall.

## Security pass before shipping

Run through `SECURITY.md`. Minimum: every private route/socket guarded; `BULLBOARD_ADMIN_PASSWORD` set (or the dashboard won't mount); `SWAGGER_PASSWORD` or `DISABLE_SWAGGER=true`; `TRUSTED_ORIGINS` locked; add rate limiting + `helmet` (not bundled).
