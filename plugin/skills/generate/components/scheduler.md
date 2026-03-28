# Scheduler

Cron job. Runs tasks on a recurring schedule using cron expressions.

## Location

`src/schedulers/<name>.js` — the filename becomes the **scheduler name**.

## Base Class

`Schedule` from `zyket`

## Template

```js
const { Schedule } = require("zyket");

module.exports = class extends Schedule {
  time = "*/5 * * * *"; // required: cron expression

  async handle({ container }) {
    // Runs on the cron schedule
  }
}
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `time` | `string` | Yes | Cron expression defining the schedule |

## Method Signature

| Param | Type | Description |
|-------|------|-------------|
| `container` | `ContainerBuilder` | DI service container |

## Cron Expression Reference

```
┌────────── minute (0-59)
│ ┌──────── hour (0-23)
│ │ ┌────── day of month (1-31)
│ │ │ ┌──── month (1-12)
│ │ │ │ ┌── day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *
```

| Expression | Meaning |
|------------|---------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 2 * * 0` | Sundays at 2 AM |

## Requirements

- The `scheduler` service must be enabled (`DISABLE_SCHEDULER` must not be `true`).
