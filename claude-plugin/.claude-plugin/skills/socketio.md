# Zyket – Socket.IO (Real-time)

Zyket provides a structured Socket.IO integration using **Handlers** and **Guards**. Disable it with `DISABLE_SOCKET=true`.

## Architecture

- **Connection Handler** (`src/handlers/connection.js`) – runs when a client connects.
- **Event Handlers** (`src/handlers/*.js`) – handle incoming Socket.IO events. The filename (without `.js`) is the event name.
- **Guards** (`src/guards/*.js`) – run before connection or events to authorize/validate clients.

## Connection Handler

```js
// src/handlers/connection.js
const { Handler } = require("zyket");

module.exports = class ConnectionHandler extends Handler {
  async handle({ container, socket, io }) {
    container.get("logger").info(`Client connected: ${socket.id}`);
    // Optionally throw to reject the connection
  }
};
```

## Event Handlers

Create a file in `src/handlers/` (any name except `connection.js`). The filename becomes the Socket.IO event name.

```js
// src/handlers/message.js  → listens for "message" event
const { Handler } = require("zyket");

module.exports = class MessageHandler extends Handler {
  guards = ["auth"]; // optional: list of guard names to run first

  async handle({ container, socket, data, io }) {
    container.get("logger").info(`Message from ${socket.id}: ${data.text}`);

    // Broadcast to all clients in a room
    io.to(data.room).emit("message", { text: data.text, from: socket.id });

    // Return value is sent back as the callback response (if client uses ack)
    return { received: true };
  }
};
```

## Guards

Guards run before the connection or before specific event handlers. Throw an error to block execution.

```js
// src/guards/auth.js
const { Guard } = require("zyket");

module.exports = class AuthGuard extends Guard {
  async handle({ container, socket, io }) {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error("Unauthorized");

    // Verify token
    const user = await verifyToken(token);
    socket.data.user = user; // attach to socket for use in handlers
  }
};
```

Attach guards to handlers using their **filename** (without `.js`):

```js
module.exports = class RoomHandler extends Handler {
  guards = ["auth", "rate-limit"]; // runs auth.js then rate-limit.js

  async handle({ container, socket, data, io }) { /* ... */ }
};
```

Attach guards to the **connection** handler in the same way:

```js
module.exports = class ConnectionHandler extends Handler {
  guards = ["auth"]; // runs before any connection is accepted

  async handle({ container, socket, io }) { /* ... */ }
};
```

## Emitting Events from Routes / Services

Access the Socket.IO server via the `socketio` service:

```js
const io = container.get("socketio").io;

// Emit to all connected clients
io.emit("notification", { message: "Hello everyone" });

// Emit to a specific room
io.to("room-id").emit("update", { data });

// All connected sockets list
const sockets = container.get("socketio").sockets;
```

## Rules

- Handlers and guards are auto-discovered from their folders on boot.
- Errors in handlers are caught, logged, and returned via the ack callback (if provided).
- Guard errors are logged as warnings and cause the ack callback to receive `{ error: message }`.
- Socket.IO uses CORS `origin: "*"` and `maxHttpBufferSize: 10MB` by default.
