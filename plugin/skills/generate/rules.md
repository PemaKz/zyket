# Zyket Generation Rules

These rules apply to **all** generated components.

## Module System

- Always use `module.exports =` — Zyket uses `require()` and validates with `prototype instanceof BaseClass`.
- Always import base classes from `zyket`: `const { Handler } = require("zyket");`

## Auto-Discovery

Handlers, guards, routes, events, schedulers, and workers are **auto-discovered** by the framework.
- The **filename** becomes the component's identity (event name, guard name, route path, etc.).
- Use **kebab-case** for filenames.
- Do **not** add constructor parameters to auto-discovered components — they receive only their name (derived from filename) via the base class constructor.

## Dependency Injection

- All component methods receive `{ container }` as part of their arguments.
- Access services via `container.get('service-name')`.
- Available default services: `logger`, `database`, `cache`, `s3`, `events`, `scheduler`, `bullmq`, `socketio`, `express`.
- Service availability depends on environment variables — check before using.

## Code Style

- Keep components focused — one responsibility per file.
- Don't add guards or middlewares unless the user explicitly asks for them.
- Don't add error handling that duplicates what the framework already provides.
- Don't add comments explaining obvious code.
