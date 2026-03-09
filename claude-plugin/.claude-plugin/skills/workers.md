# Zyket – Workers & Job Queues (BullMQ)

Zyket integrates BullMQ for background job processing. Requires Redis (`CACHE_URL`) and `DISABLE_BULLMQ` must not be `true`.

## Configuration

```env
CACHE_URL=redis://localhost:6379
QUEUES=emails,notifications,exports   # comma-separated queue names
# DISABLE_BULLMQ defaults to true – set it to false or simply omit it
DISABLE_BULLMQ=false
```

## Creating a Worker

Workers live in `src/workers/`. Each file must export a class extending `Worker` from `zyket`.

```js
// src/workers/send-email.js
const { Worker } = require("zyket");

module.exports = class SendEmailWorker extends Worker {
  queueName = "emails"; // Must match a name in the QUEUES env var

  async handle({ container, job }) {
    const { to, subject, body } = job.data;
    container.get("logger").info(`Sending email to ${to}`);

    // Send the email using your preferred library
    // await mailer.send({ to, subject, body });

    return { sent: true };
  }
};
```

## Rules

- The `queueName` property must match one of the comma-separated queue names in the `QUEUES` env var.
- If `queueName` is not set or doesn't match a registered queue, the worker is skipped with a warning.
- Multiple workers can process the same queue.
- Return any serialisable value from `handle()` – it becomes the job result.
- Throw an error from `handle()` to mark the job as failed (BullMQ will retry based on job options).

## Dispatching Jobs from Routes / Services

Use the `queues` service (name: `"queues"`):

```js
// Fire and forget
await container.get("queues").addJob("emails", "send-welcome", { to: "user@example.com" });

// Wait for the job to complete (up to 60 seconds)
const result = await container.get("queues").addJob(
  "emails",
  "send-welcome",
  { to: "user@example.com" },
  {},    // BullMQ job options
  true   // waitForCompletion
);
```

## Job Options

Pass standard BullMQ job options as the fourth argument:

```js
await container.get("queues").addJob("exports", "generate-report", data, {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  delay: 5000, // ms until job is processed
});
```

## Bull Board (Admin UI)

Use the `BullBoardExtension` to get a visual job dashboard at `/admin/queues`:

```js
// index.js
const { Kernel, BullBoardExtension } = require("zyket");

const kernel = new Kernel({
  extensions: [new BullBoardExtension()],
});

kernel.boot();
```
