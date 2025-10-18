const Service = require("../Service");
const { Queue, QueueEvents, Worker: BullWorker } = require("bullmq");
const Worker = require("./Worker");
const fs = require("fs");
const path = require("path");
const fg = require('fast-glob');

module.exports = class BullMQ extends Service  {
  #container
  queues = {};
  queuesEvents = {};

  constructor(container) {
    super("queues");
    this.#container = container;
  }

  async boot() {
    const queusConfig = this.#getActivatedQueues();

    for (const queueName of queusConfig) {
      this.queues[queueName] = new Queue(queueName, this.#connection());
      this.queuesEvents[queueName] = new QueueEvents(queueName, this.#connection());
      await this.#container.loggfer.info(`Queue ${queueName} initialized`);
    }

    const workers = await this.#loadWorkersFromFolder(path.join(process.cwd(), "src", "workers"));

    for (const wkr of workers) {
      if(!wkr.queueName) {
        this.#container.get('logger').warn(`Worker ${wkr.name} has no queueName defined, skipping...`);
        continue;
      }
      if (!this.queues[wkr.queueName]) {
        this.#container.get('logger').warn(`Queue ${wkr.queueName} not found for worker ${wkr.name}, skipping...`);
        continue;
      }
      new BullWorker(
        wkr.queueName,
        async (job) => wkr.handle({ container: this.#container, job }),
        this.#connection()
      );
      this.#container.get('logger').info(`Worker ${wkr.name} for queue ${wkr.queueName} initialized`);
    }
  }

  async #loadWorkersFromFolder(workersFolder) {
    this.#createWorkersFolder(workersFolder);
    const workers = (await fg('**/*.js', { cwd: workersFolder })).map((wkr) => {
      const worker = require(path.join(workersFolder, wkr));
      if(!(worker.prototype instanceof Worker)) throw new Error(`${wkr} is not a valid handler`);
      return new worker(wkr.replace('.js', ''));
    });
    return workers;
  }

  #createWorkersFolder(workersFolder, overwrite = false) {
    if (fs.existsSync(workersFolder) && !overwrite) return;
    this.#container.get('logger').info(`Creating workers folder at ${workersFolder}`);
    fs.mkdirSync(workersFolder);
  }

  #getActivatedQueues() {
    const list = process.env.QUEUES || "";
    return list.split(",").map(q => q.trim()).filter(q => q.length);
  }

  #connection() {
    return {
        connection: {
          url: process.env.REDIS_URL || "redis://localhost:6379"
        }
    };
  }
}