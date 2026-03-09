# Create a Zyket Schedule

Create a new cron-based scheduled task in the Zyket project.

## Instructions

Schedulers live in `src/schedulers/`. Each file exports a class extending `Schedule` from `zyket`. The `time` property must be a valid `node-cron` expression.

### Template

```js
const { Schedule } = require("zyket");

module.exports = class $Name$Schedule extends Schedule {
  time = "$cron-expression$"; // e.g. "0 * * * *" for every hour

  async handle({ container }) {
    container.get("logger").info("Running $Name$ schedule");
    // Your scheduled logic here
  }
};
```

### Common cron expressions

| Pattern | Meaning |
|---|---|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Every day at midnight |
| `0 9 * * 1` | Every Monday at 9:00 |
| `*/5 * * * *` | Every 5 minutes |

### Steps:
1. Create `src/schedulers/$name$.js`.
2. Set `time` to the appropriate cron expression.
3. Implement the recurring task logic.
4. Remind the user to set `DISABLE_SCHEDULER=false` in `.env`.
