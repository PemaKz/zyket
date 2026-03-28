# Guard

Socket.IO guard. Protects handlers and connections by running validation logic before they execute.

## Location

`src/guards/<name>.js` — the filename becomes the **guard name** referenced in handlers.

## Base Class

`Guard` from `zyket`

## Template

```js
const { Guard } = require("zyket");

module.exports = class extends Guard {
  async handle({ container, socket, io }) {
    // Throw an error to block the event or connection
    // If this method completes without throwing, the guard passes
  }
}
```

## Method Signature

| Param | Type | Description |
|-------|------|-------------|
| `container` | `ContainerBuilder` | DI service container |
| `socket` | `Socket` | The connected socket |
| `io` | `Server` | Socket.IO server instance |

## Usage

Reference guards by filename (without `.js`) in a handler's `guards` array:

```js
// src/handlers/send-message.js
module.exports = class extends Handler {
  guards = ["auth"]; // references src/guards/auth.js
  async handle({ container, socket, data, io }) { }
}
```
