# Worker

BullMQ job processor. Processes background jobs from a named queue.

## Location

`src/workers/<name>.js` — the filename becomes the **worker name**.

## Base Class

`Worker` from `zyket`

## Template

```js
const { Worker } = require("zyket");

module.exports = class extends Worker {
  queueName = "my-queue"; // required: must match a queue in QUEUES env var

  async handle({ container, job }) {
    // job.data contains the job payload
  }
}
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `queueName` | `string` | Yes | Name of the BullMQ queue to process |

## Method Signature

| Param | Type | Description |
|-------|------|-------------|
| `container` | `ContainerBuilder` | DI service container |
| `job` | `Job` | BullMQ job instance |

## Adding Jobs to a Queue

From any component with container access:

```js
const bull = container.get('bullmq');
await bull.queues['my-queue'].add('job-name', { key: "value" });
```

## Requirements

- `CACHE_URL` environment variable must be set (Redis connection).
- `QUEUES` environment variable must include the queue name.
- `DISABLE_BULLMQ` must not be `true`.
