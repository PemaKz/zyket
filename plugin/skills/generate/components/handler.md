# Handler

Socket.IO event handler. Receives and responds to real-time WebSocket events.

## Location

`src/handlers/<name>.js` — the filename becomes the **event name** the client emits.

The special file `src/handlers/connection.js` runs when a new socket connects.

## Base Class

`Handler` from `zyket`

## Template

```js
const { Handler } = require("zyket");

module.exports = class extends Handler {
  // Optional: guard names that must pass before this handler runs
  // guards = ["auth"];

  async handle({ container, socket, data, io }) {
    // data — payload sent by the client
    // socket — the connected socket instance
    // io — the Socket.IO server instance
    // Return value is sent back via callback if the client provided one
  }
}
```

## Method Signature

| Param | Type | Description |
|-------|------|-------------|
| `container` | `ContainerBuilder` | DI service container |
| `socket` | `Socket` | The connected socket |
| `data` | `any` | Payload from the client |
| `io` | `Server` | Socket.IO server instance |

## Guards

Set `guards` as an array of guard filenames (without `.js`). Guards run in order before the handler. If a guard throws, the handler is skipped and the error is returned to the client callback.

```js
guards = ["auth", "rate-limit"];
```
