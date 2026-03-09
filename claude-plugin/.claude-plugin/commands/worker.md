# Create a Zyket BullMQ Worker

Create a new BullMQ worker file in the Zyket project.

## Instructions

Workers live in `src/workers/`. Each file must export a class extending `Worker` from `zyket`.

### Template

```js
const { Worker } = require("zyket");

module.exports = class $WorkerName$Worker extends Worker {
  queueName = "$queue-name$"; // Must match a name in the QUEUES env var

  async handle({ container, job }) {
    const data = job.data;
    container.get("logger").info(`Processing job ${job.id}`, data);

    // Your job logic here

    return { success: true };
  }
};
```

### Steps:
1. Create `src/workers/$worker-name$.js`.
2. Set `queueName` to the appropriate queue name.
3. Implement the job processing logic.
4. Remind the user to:
   - Add `DISABLE_BULLMQ=false` to `.env`
   - Add the queue name to `QUEUES` in `.env` (e.g. `QUEUES=emails,notifications`)
   - Set `CACHE_URL` in `.env`
5. Show how to dispatch a job:
   ```js
   await container.get("queues").addJob("$queue-name$", "job-name", { ...data });
   ```
