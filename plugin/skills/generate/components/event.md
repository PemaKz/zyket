# Event

Internal event handler. Enables decoupled pub/sub communication between components.

## Location

`src/events/<name>.js` — the filename becomes the **event name**.

## Base Class

`Event` from `zyket`

## Template

```js
const { Event } = require("zyket");

module.exports = class extends Event {
  async handle({ container, payload }) {
    // Process the event payload
  }
}
```

## Method Signature

| Param | Type | Description |
|-------|------|-------------|
| `container` | `ContainerBuilder` | DI service container |
| `payload` | `any` | Data passed when the event was emitted |

## Emitting Events

From any component with container access:

```js
// Synchronous-style (still returns promise)
container.get('events').emit('event-name', { key: "value" });

// Async with timeout (default 30s)
await container.get('events').emitAsync('event-name', { key: "value" }, 15000);
```

## Requirements

- The `events` service must be enabled (`DISABLE_EVENTS` must not be `true`).
- The event name used in `emit()` must match a filename in `src/events/`.
