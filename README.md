# Zyket

Zyket is a service-oriented Node.js framework for building real-time and REST applications with **Express 5**, **Socket.IO**, **better-auth**, and **Sequelize/BullMQ/MinIO**. Inspired by Symfony, it pairs a dependency-injection container with filesystem-based auto-discovery: drop a file in the right folder and the framework wires it up.

> **Building with an AI agent?** See **[AGENTS.md](AGENTS.md)** for a complete, machine-readable reference, and **[SECURITY.md](SECURITY.md)** for hardening guidance.

## Getting started

```bash
mkdir my-app && cd my-app
npm install zyket

# Initialize from a template (interactive picker)
npx zyket init
# …or pick one directly:
npx zyket init api-rest      # default | api-rest | saas-multitenant | realtime-chat
```

`init` scaffolds the template, generates a `.env`, writes `package.json` with the right dependencies, and installs them. Templates that ship authentication need their tables created once:

```bash
npx @better-auth/cli migrate --config src/services/auth/auth.js
node index.js
```

### Templates

| Template | What you get |
|----------|--------------|
| `default` | General starter (backend + optional React frontend) |
| `api-rest` | Backend-only REST API with auth and a protected CRUD resource |
| `saas-multitenant` | Multi-tenant SaaS (organizations, roles) + React dashboard |
| `realtime-chat` | Authenticated real-time chat (Socket.IO) + React UI |

### Manual boot

```js
// index.js
const { Kernel } = require("zyket");

const kernel = new Kernel({
  services: [
    ["auth", require("./src/services/auth"), ["@service_container"]],
  ],
});

kernel.boot().then(() => console.log("Kernel booted!"));
```

On first run Zyket creates a `.env` and a `src/` directory with boilerplate.

## Core concepts

- **Routes & Middlewares** — REST endpoints via Express, auto-discovered from `src/routes`.
- **Handlers & Guards** — Socket.IO events and their authorization, from `src/handlers` / `src/guards`.
- **Services** — reusable units managed by a DI container (`logger`, `database`, `cache`, `s3`, `events`, `scheduler`, `bullmq`, `socketio`, `express`, `auth`).
- **Extensions** — post-boot plugins (e.g. BullBoard, interactive storage).
- **Templates & CLI** — scaffold whole projects or individual components.

### Routes

File path maps to the URL: `src/routes/index.js` → `/`, `src/routes/users/[id].js` → `/users/:id`. Methods: `get`, `post`, `put`, `delete`.

```js
const { Route, RequireAuthMiddleware } = require("zyket");

module.exports = class extends Route {
  middlewares = { post: [new RequireAuthMiddleware()] };

  async get({ container, request }) {
    return { items: [] };                       // → { success: true, items: [] }
  }
  async post({ container, request }) {
    if (!request.body.name) return { success: false, message: "name required", status: 400 };
    return { created: true, status: 201 };
  }
};
```

Return an object (wrapped as `{ success: true, ... }`), set `status` to change the HTTP code, return a `Buffer` for a download, or `new RedirectResponse(url)` to redirect.

### Middlewares

```js
const { Middleware } = require("zyket");

module.exports = class extends Middleware {
  async handle({ container, request, response, next }) {
    next(); // respond to block, or next() to continue
  }
};
```

### Socket.IO handlers & guards

```js
// src/handlers/message.js  → "message" event
const { Handler } = require("zyket");

module.exports = class extends Handler {
  guards = ["auth"];
  async handle({ container, socket, data, io }) {
    io.emit("message", data);
    return { ok: true };
  }
};
```

```js
// src/guards/auth.js — reuse the built-in session guard
module.exports = require("zyket").AuthGuard;
```

## Authentication

Zyket ships first-class auth via [better-auth](https://better-auth.com) mounted at `/api/auth/*`, with the admin, bearer, and (optional) organization plugins. Customize by subclassing `AuthService`; protect routes/sockets with `RequireAuthMiddleware`, `RequireAdminMiddleware`, and `AuthGuard`.

```js
const { Route, RequireAdminMiddleware } = require("zyket");

module.exports = class extends Route {
  middlewares = { get: [new RequireAdminMiddleware()] };
  async get() { return { secret: "admins only" }; }
};
```

Cookies are environment-aware: `sameSite=lax` in local dev (works over `http://localhost`), and `sameSite=none; secure` when `AUTH_CROSS_DOMAIN=true` for cross-domain HTTPS deployments. See [AGENTS.md §6](AGENTS.md#6-authentication-better-auth).

## Services

Default services activate from environment variables (see [AGENTS.md §3–4](AGENTS.md#3-environment-variables)). Register your own in the Kernel:

```js
const { Service } = require("zyket");

module.exports = class MyService extends Service {
  #container;
  constructor(container) { super("my-service"); this.#container = container; }
  async boot() { /* init */ }
  doThing() { return "done"; }
};
```

```js
const kernel = new Kernel({
  services: [["my-service", MyService, ["@service_container"]]],
});
```

Default services and their activation:

| Service | Env to enable |
|---------|---------------|
| `database` | `DATABASE_URL` (+ `DATABASE_DIALECT`, default `sqlite`) |
| `cache` | always (`CACHE_URL=redis://…` for Redis, else in-memory) |
| `s3` | `S3_ENDPOINT` + `S3_ACCESS_KEY` + `S3_SECRET_KEY` (MinIO) |
| `socketio` | `DISABLE_SOCKET=false` |
| `bullmq` | `DISABLE_BULLMQ=false` + `QUEUES=...` |
| `scheduler` | `DISABLE_SCHEDULER=false` |
| `events` | `DISABLE_EVENTS=false` |
| `vite` | `VITE_ROOT` + `DISABLE_VITE=false` |
| `auth` | manual registration (requires `sqlite`/`postgresql`) |

## Security

Zyket bakes in several defaults (random per-project `AUTH_SECRET`, fail-closed BullBoard, configurable payload limits, path-traversal guards on storage). Review **[SECURITY.md](SECURITY.md)** before going to production — notably rate limiting and `helmet` are not bundled.

## Tooling for AI agents

- **[AGENTS.md](AGENTS.md)** — full framework reference.
- **Claude Code plugin** (`plugin/`) — skills to scaffold and use Zyket (`generate`, `build`).

## Contributing

Issues and pull requests are welcome — bug fixes, features, and documentation improvements. Let's build a better framework together. 🚀
