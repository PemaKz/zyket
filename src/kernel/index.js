const {ContainerBuilder} = require("node-dependency-injection");
const EnvManager = require("../utils/EnvManager");
const fs = require("fs");
const path = require("path");

module.exports = class Kernel {
  container;
  #services;
  #onSocketConnection;

  constructor({ 
    services = [],
    onConnection = () => { },
  } = { }) {
    this.container = new ContainerBuilder();
    this.#services = services;

    // create src folder if not exists
    if (!fs.existsSync(path.join(process.cwd(), "src"))) {
      fs.mkdirSync(path.join(process.cwd(), "src"));
    }
  }

  async boot(clearConsole = true, secretsPath = `${process.cwd()}/.env`) {
    EnvManager.load(secretsPath, false);
    if(clearConsole) process.stdout.write("\u001b[2J\u001b[0;0H");
    const services = require("../services");

    await this.#registerServices(services);
    await this.#registerServices(this.#services);

    for (const [name] of [...services, ...this.#services]) {
      this.container.get('logger').debug(`Booting service ${name}`);
      await this.container.get(name).boot();
    }
  }

  async #registerServices(servicesToRegister = []) {
    for (const [name, serviceClass, args] of servicesToRegister) {
      this.container.register(name, serviceClass, args.map(arg => {
        if(arg === "@service_container") return this.container;
        if(arg === "@onConnection") return this.#onSocketConnection;
        return arg
      }));
      if(this.container.has("logger")) {
        this.container.get("logger").debug(`Service ${name} registered`);
      }
    }

    this.container.compile();
  }
}