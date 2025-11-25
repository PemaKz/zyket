const {ContainerBuilder} = require("node-dependency-injection");
const EnvManager = require("../utils/EnvManager");
const fs = require("fs");
const path = require("path");
const HTTPServer = require("./HTTPServer");
const Extension = require("../extensions/Extension");

module.exports = class Kernel {
  container;
  #services;
  #onSocketConnection;
  #httpServer;
  #extensions = [];

  constructor({ 
    services = [],
    extensions = [],
  } = { }) {
    this.container = new ContainerBuilder();
    this.#services = services;
    this.#extensions = extensions;

    // create src folder if not exists
    if (!fs.existsSync(path.join(process.cwd(), "src"))) {
      fs.mkdirSync(path.join(process.cwd(), "src"));
    }
  }

  async boot(clearConsole = true, secretsPath = `${process.cwd()}/.env`) {
    EnvManager.load(secretsPath, false);
    if(clearConsole) process.stdout.write("\u001b[2J\u001b[0;0H");
    this.#httpServer = new HTTPServer({ port: Number(process.env.PORT) || 3000 });
    await this.#httpServer.start();

    const services = require("../services");

    await this.#registerServices(services);
    await this.#registerServices(this.#services);


    for (const [name] of [...services, ...this.#services]) {
      this.container.get('logger').debug(`Booting service ${name}`);
      await this.container.get(name).boot({
        httpServer: this.#httpServer.server,
      });
    }

    for (const extension of this.#extensions) {
      if (!(extension instanceof Extension)) {
        throw new Error(`Extension ${extension.name} is not an instance of Extension class`);
      }
      this.container.get('logger').debug(`Loading extension ${extension.name}`);
      await extension.load(this.container);
    }



    return this;
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

  async #loadExtensions() {
    // Load extensions if any
  }
}