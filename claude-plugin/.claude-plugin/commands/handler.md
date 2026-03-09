# Create a Zyket Socket.IO Handler

Create a new Socket.IO event handler file in the Zyket project.

## Instructions

Handlers live in `src/handlers/`. The filename (without `.js`) is the Socket.IO event name. The special file `connection.js` is the connection handler.

### Event Handler Template

```js
const { Handler } = require("zyket");

module.exports = class $EventName$Handler extends Handler {
  guards = []; // optional: list guard filenames (without .js) to run first

  async handle({ container, socket, data, io }) {
    container.get("logger").info(`$EventName$ from ${socket.id}`, data);

    // Your event handling logic here

    // Return value is sent back via ack callback (if client uses acks)
    return { success: true };
  }
};
```

### Steps:
1. Create `src/handlers/$event-name$.js`.
2. Add guard names to the `guards` array if authorization is needed.
3. Implement the event handling logic.
4. Optionally show the client-side code to emit the event:
   ```js
   socket.emit("$event-name$", { ...data }, (response) => {
     console.log(response); // { success: true }
   });
   ```
