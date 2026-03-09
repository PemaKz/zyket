# Zyket – Events

The events service provides a simple in-process event bus. Activate it by setting `DISABLE_EVENTS=false` in `.env`.

## Creating an Event

Events live in `src/events/`. Each file must export a class that extends `Event` from `zyket`.

The **filename** (without `.js`) is used as the event name.

```js
// src/events/user-registered.js
const { Event } = require("zyket");

module.exports = class UserRegisteredEvent extends Event {
  async handle({ container, payload }) {
    const { user } = payload;
    container.get("logger").info(`User registered: ${user.email}`);

    // Send welcome email, trigger other logic, etc.
    // Example: add job to queue
    await container.get("queues").addJob("emails", "send-welcome", { to: user.email });
  }
};
```

## Emitting Events

From any route, service, middleware, or handler, use the `events` service:

```js
// Synchronous – waits for handler to complete
container.get("events").emit("user-registered", { user });

// Asynchronous – fire and forget with optional timeout (default: 30s)
container.get("events").emitAsync("user-registered", { user });
container.get("events").emitAsync("user-registered", { user }, 5000); // 5s timeout
```

## Rules

- The event file name (without `.js`) must match the name passed to `emit()` / `emitAsync()`.
- Subdirectory paths are preserved: `src/events/auth/login.js` → event name `auth/login`.
- Throwing inside `handle()` will propagate the error back to the emitter.
- Enable the events service: `DISABLE_EVENTS=false` in `.env`.

## Example: Emit after creating a user

```js
// src/routes/users.js
const { Route } = require("zyket");

module.exports = class UsersRoute extends Route {
  async post({ container, request }) {
    const db = container.get("database");
    const user = await db.models.User.create(request.body);

    container.get("events").emitAsync("user-registered", { user });

    return { user, status: 201 };
  }
};
```
