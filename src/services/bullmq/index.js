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
  workers = [];

  constructor(container) {
    super("queues");
    this.#container = container;
  }

  async boot() {
    const queusConfig = this.#getActivatedQueues();

    for (const queueName of queusConfig) {
      this.queues[queueName] = new Queue(queueName, this.#connection());
      this.queuesEvents[queueName] = new QueueEvents(queueName, this.#connection());
      await this.#container.get('logger').info(`Queue ${queueName} initialized`);
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

      const instances = await this.#resolveInstances(wkr);
      for (const [index, instance] of instances.entries()) {
        const options = await this.#resolveOptions(wkr, instance, index);
        const bullWorker = new BullWorker(
          wkr.queueName,
          async (job) => wkr.handle({ container: this.#container, job, instance, index }),
          { ...this.#connection(), ...options }
        );
        this.workers.push(bullWorker);
      }
      this.#container.get('logger').info(`Worker ${wkr.name} for queue ${wkr.queueName} initialized with ${instances.length} instance(s)`);
    }
  }

  async #resolveInstances(wkr) {
    let instances = wkr.instances;
    if (typeof instances === 'function') {
      instances = await instances({ container: this.#container });
    }
    if (typeof instances === 'number' && instances > 0) {
      return Array.from({ length: instances }, () => ({}));
    }
    if (Array.isArray(instances) && instances.length) {
      return instances;
    }
    return [{}];
  }

  async #resolveOptions(wkr, instance, index) {
    const options = typeof wkr.options === 'function'
      ? await wkr.options({ container: this.#container, instance, index })
      : wkr.options;
    return options || {};
  }

  async addJob(queueName, jobName, data, opts = {}, waitForCompletion = false) {
    if (!this.queues[queueName]) throw new Error(`Queue ${queueName} not found`);
    const job = await this.queues[queueName].add(jobName, data, opts);
    if (!waitForCompletion) return job;

    return new Promise((resolve, reject) => {
      const queueEvent = this.queuesEvents[queueName];
      job.waitUntilFinished(queueEvent, 1000 * 60).then((result) => {
        resolve(result);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  async #loadWorkersFromFolder(workersFolder) {
    this.#createWorkersFolder(workersFolder);
    const workers = (await fg('**/*.js', { cwd: workersFolder })).map((wkr) => {
      const worker = require(path.join(workersFolder, wkr));
      if(!(worker.prototype instanceof Worker)) {
        this.#container.get('logger').warn(`File ${wkr} does not export a valid Worker class, skipping...`);
        return null;
      }
      return new worker(wkr.replace('.js', ''));
    }).filter(wkr => wkr !== null);
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
          url: process.env.CACHE_URL || "redis://localhost:6379"
        }
    };
  }
}