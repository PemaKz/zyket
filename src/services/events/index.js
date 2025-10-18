const Service = require("../Service");
const fs = require("fs");
const path = require("path");
const fg = require('fast-glob');
const Event = require("./Event");

module.exports = class EventService extends Service  {
  #container
  events = {};

  constructor(container) {
    super("events");
    this.#container = container;
  }


  emit(eventName, payload) {
    const event = this.events[eventName];
    if (!event) throw new Error(`Event ${eventName} not found`);
    this.#container.get('logger').debug(`Emitting event ${eventName}`);
    return event.handle({ container: this.#container, payload });
  }

  emitAsync(eventName, payload, timeout = 30000) {
    const event = this.events[eventName];
    if (!event) throw new Error(`Event ${eventName} not found`);
    this.#container.get('logger').debug(`Emitting event ${eventName} asynchronously`);
    return Promise.race([
      event.handle({ container: this.#container, payload }),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Event ${eventName} timed out after ${timeout}ms`)), timeout))
    ]);
  }

  async boot() {
    const events = await this.#loadEventsFromFolder(path.join(process.cwd(), "src", "events"));
    this.#container.get('logger').info(`Loaded ${events.length} events`);
    for (const evt of events) {
      this.events[evt.name] = evt;
      this.#container.get('logger').debug(`Event ${evt.name} initialized`);
    }
  }

  async #loadEventsFromFolder(eventsFolder) {
    this.#createEventsFolder(eventsFolder);
    const events = (await fg('**/*.js', { cwd: eventsFolder })).map((evt) => {
      const event = require(path.join(eventsFolder, evt));
      if(!(event.prototype instanceof Event)) throw new Error(`${evt} is not a valid handler`);
      return new event(evt.replace('.js', ''));
    });
    return events;
  }

  #createEventsFolder(eventsFolder, overwrite = false) {
    if (fs.existsSync(eventsFolder) && !overwrite) return;
    this.#container.get('logger').info(`Creating schedules folder at ${eventsFolder}`);
    fs.mkdirSync(eventsFolder);
  }


}