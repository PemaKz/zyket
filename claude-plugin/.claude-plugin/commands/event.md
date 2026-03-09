# Create a Zyket Event

Create a new event file in the Zyket project.

## Instructions

Events live in `src/events/`. The filename (without `.js`) is the event name used in `emit()`.

### Template

```js
const { Event } = require("zyket");

module.exports = class $EventName$Event extends Event {
  async handle({ container, payload }) {
    container.get("logger").info("$EventName$ event fired", payload);
    // Your event logic here
  }
};
```

### Steps:
1. Create `src/events/$event-name$.js`.
2. Implement the handler logic based on the user's description.
3. Show the user how to emit it:
   ```js
   container.get("events").emitAsync("$event-name$", { ...payload });
   ```
4. Remind the user to set `DISABLE_EVENTS=false` in `.env`.
