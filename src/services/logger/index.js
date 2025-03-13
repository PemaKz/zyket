const fs = require("fs");
const Service = require("../Service");
require("colors");

module.exports = class Logger extends Service  {
  #container
  #logDirectory;
  #debugEnabled;
  messageColors = {
    log: "white",
    info: "green",
    warn: "yellow",
    error: "red",
    debug: "blue"
  };
  #storeTries = 0;

  constructor(container, logDirectory, debugEnabled) {
    super("logger");
    this.#container = container;
    this.#logDirectory = logDirectory;
    this.#debugEnabled = debugEnabled;
  }

  async boot() {
    if (!fs.existsSync(this.#logDirectory)) fs.mkdirSync(this.#logDirectory);
    return this;
  }

  async store(message) {
    if (this.#storeTries > 10) throw new Error("Failed to store log message");
    this.#storeTries++;
    try{
      fs.appendFileSync(`${this.#logDirectory}/${new Date().toISOString().split("T")[0]}.log`, `${message}\n`);
      this.#storeTries = 0;
    } catch (e) {
      if (!fs.existsSync(this.#logDirectory)) {
        fs.mkdirSync(this.#logDirectory);
      }

      if (!fs.existsSync(`${this.#logDirectory}/${new Date().toISOString().split("T")[0]}.log`)) {
        fs.writeFileSync(`${this.#logDirectory}/${new Date().toISOString().split("T")[0]}.log`, "");
      }
      
      return this.store(message);
    }
  }

  getDateTimestamp() {
    return new Date().toISOString().replace("T", " ").replace("Z", "");
  }

  buildMessage(type, message) {
    return `${this.getDateTimestamp()} [${type.toUpperCase()}] ${message}`[this.messageColors[type]];
  }

  async log(message) {
    console.log(this.buildMessage("log", message));
    this.store(this.buildMessage("log", message));
  }

  async info(message) {
    console.log(this.buildMessage("info", message));
    this.store(this.buildMessage("info", message));
  }

  async warn(message) {
    console.log(this.buildMessage("warn", message));
    this.store(this.buildMessage("warn", message));
  }

  async error(message) {
    console.log(this.buildMessage("error", message));
    this.store(this.buildMessage("error", message));
  }

  async debug(message) {
    this.#debugEnabled && console.log(this.buildMessage("debug", message));
    this.store(this.buildMessage("debug", message));
  }
}