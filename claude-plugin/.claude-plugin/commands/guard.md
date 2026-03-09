# Create a Zyket Socket.IO Guard

Create a new Socket.IO guard file in the Zyket project.

## Instructions

Guards live in `src/guards/`. The filename (without `.js`) is the guard name used in handler `guards` arrays. Guards run before an event handler or connection and can block execution by throwing an error.

### Template

```js
const { Guard } = require("zyket");

module.exports = class $Name$Guard extends Guard {
  async handle({ container, socket, io }) {
    // Validate / authorize the socket
    // Throw an error to block the event or connection
    // e.g.:
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error("Unauthorized");

    // Attach data to socket for handlers to use
    // socket.data.user = verifiedUser;
  }
};
```

### Steps:
1. Create `src/guards/$name$.js`.
2. Implement the authorization logic.
3. Show how to attach it to a handler:
   ```js
   module.exports = class MyHandler extends Handler {
     guards = ["$name$"];
     // ...
   };
   ```
