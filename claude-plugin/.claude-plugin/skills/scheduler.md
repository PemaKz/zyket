# Zyket – Scheduler (Cron Tasks)

The scheduler service runs recurring tasks using `node-cron`. Enable it by setting `DISABLE_SCHEDULER=false`.

## Configuration

```env
DISABLE_SCHEDULER=false
```

## Creating a Scheduled Task

Schedulers live in `src/schedulers/`. Each file must export a class extending `Schedule` from `zyket`.

```js
// src/schedulers/cleanup.js
const { Schedule } = require("zyket");

module.exports = class CleanupSchedule extends Schedule {
  time = "0 2 * * *"; // every day at 02:00 AM (node-cron syntax)

  async handle({ container }) {
    container.get("logger").info("Running cleanup task...");
    const db = container.get("database");
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    await db.models.Log.destroy({ where: { createdAt: { [db.Op.lt]: cutoff } } });
    container.get("logger").info("Cleanup complete");
  }
};
```

## Cron Syntax (node-cron)

```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └── Day of week (0–7, 0 and 7 = Sunday)
│ │ │ │ └──── Month (1–12)
│ │ │ └────── Day of month (1–31)
│ │ └──────── Hour (0–23)
│ └────────── Minute (0–59)
└──────────── Second (0–59, optional)
```

Common patterns:

| Pattern | Meaning |
|---|---|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Every day at midnight |
| `0 9 * * 1` | Every Monday at 9:00 |
| `*/5 * * * *` | Every 5 minutes |
| `0 0 1 * *` | First of every month |

## Rules

- Errors thrown from `handle()` are caught and logged – they do not crash the scheduler.
- Each scheduler file maps to one cron job.
- The `name` property is automatically set to the filename (without `.js`).
