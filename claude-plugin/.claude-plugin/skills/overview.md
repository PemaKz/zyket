# Zyket Framework Overview

Zyket is a Node.js backend framework that uses a service-oriented, dependency-injection architecture. It is installed as an npm package: `npm install zyket`.

## Project Structure

A typical Zyket project has this layout:

```
my-app/
├── index.js          # Entry point – boots the Kernel
├── .env              # Environment variables (auto-created on first boot)
├── config/
│   ├── cors.js       # CORS configuration (auto-created)
│   └── swagger.js    # Swagger/OpenAPI configuration (auto-created)
└── src/
    ├── routes/       # Express HTTP routes (file-based routing)
    ├── middlewares/  # Express middlewares
    ├── handlers/     # Socket.IO event handlers
    ├── guards/       # Socket.IO guards
    ├── events/       # App events
    ├── workers/      # BullMQ job workers
    ├── schedulers/   # Cron-based scheduled tasks
    ├── models/       # Sequelize database models
    └── services/     # Custom application services (optional)
```

## Entry Point

```js
// index.js
const { Kernel } = require("zyket");

const kernel = new Kernel({
  services: [],   // Custom services: [["name", ServiceClass, [constructorArgs]]]
  extensions: [], // Extensions: instances of Extension subclasses
});

kernel.boot();
```

## Kernel

`Kernel` is the application bootstrap class. It:
- Loads `.env` automatically via `EnvManager`
- Starts an HTTP server (default port `3000`, override with `PORT` env var)
- Registers and boots all built-in services
- Registers and boots custom services
- Loads all extensions

### Service Registration

Custom services are registered as tuples in the `services` array:

```js
["serviceName", ServiceClass, ["constructorArg1", "constructorArg2"]]
```

Use the special string `"@service_container"` to inject the DI container as a constructor argument.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `DEBUG` | `false` | Enable debug logging |
| `DATABASE_URL` | `` | Database connection string (activates DB service) |
| `DATABASE_DIALECT` | `mariadb` | `mariadb` or `postgresql` |
| `CACHE_URL` | `` | Redis URL (activates cache + BullMQ) |
| `DISABLE_SOCKET` | `false` | Disable Socket.IO |
| `DISABLE_EXPRESS` | `false` | Disable Express |
| `DISABLE_EVENTS` | `true` | Disable events service |
| `DISABLE_BULLMQ` | `true` | Disable BullMQ (requires CACHE_URL) |
| `DISABLE_SCHEDULER` | `true` | Disable cron scheduler |
| `S3_ENDPOINT` | `` | S3/MinIO endpoint (activates S3 service) |
| `S3_ACCESS_KEY` | `` | S3 access key |
| `S3_SECRET_KEY` | `` | S3 secret key |
| `S3_PORT` | `` | S3 port |
| `S3_USE_SSL` | `true` | S3 SSL |
| `QUEUES` | `` | Comma-separated BullMQ queue names |
| `LOG_DIRECTORY` | `./logs` | Log file directory |
| `SWAGGER_PATH` | `/docs` | Swagger UI path |

## Built-in Services (accessed via `container.get(name)`)

| Name | Description |
|---|---|
| `logger` | Winston-based logger |
| `template-manager` | Template file manager |
| `events` | Event bus |
| `database` | Sequelize ORM (if `DATABASE_URL` set) |
| `cache` | Redis client (if `CACHE_URL` set) |
| `s3` | MinIO/S3 client (if `S3_*` vars set) |
| `scheduler` | Cron scheduler |
| `queues` | BullMQ queue manager (if `CACHE_URL` set) |
| `socketio` | Socket.IO server |
| `express` | Express app wrapper |

## Accessing Services

Inside any route, middleware, handler, guard, event, worker, or scheduler, use the injected `container`:

```js
const logger = container.get("logger");
const db = container.get("database");
const cache = container.get("cache");
const queues = container.get("queues");
const io = container.get("socketio").io;
```
