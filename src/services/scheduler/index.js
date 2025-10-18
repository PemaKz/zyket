const Service = require("../Service");
const Schedule = require("./Schedule");
const fs = require("fs");
const path = require("path");
const fg = require('fast-glob');
const cron = require('node-cron');

module.exports = class Scheduler extends Service  {
  #container

  constructor(container) {
    super("scheduler");
    this.#container = container;
  }

  async boot() {
    const schedulers = await this.#loadSchedulersFromFolder(path.join(process.cwd(), "src", "schedulers"));
    await this.#container.get('logger').info(`Loaded ${schedulers.length} schedulers`);
    for (const schd of schedulers) {
      cron.schedule(schd.time, () => schd.handle({ container: this.#container }));
      this.#container.get('logger').info(`Scheduler ${schd.name}, ${schd.time} initialized`);
    }
  }

  async #loadSchedulersFromFolder(schedulersFolder) {
    this.#createSchedulersFolder(schedulersFolder);
    const schedulers = (await fg('**/*.js', { cwd: schedulersFolder })).map((schd) => {
      const schedule = require(path.join(schedulersFolder, schd));
      if(!(schedule.prototype instanceof Schedule)) throw new Error(`${schd} is not a valid handler`);
      return new schedule(schd.replace('.js', ''));
    });
    return schedulers;
  }

  #createSchedulersFolder(schedulersFolder, overwrite = false) {
    if (fs.existsSync(schedulersFolder) && !overwrite) return;
    this.#container.get('logger').info(`Creating schedules folder at ${schedulersFolder}`);
    fs.mkdirSync(schedulersFolder);
  }


}