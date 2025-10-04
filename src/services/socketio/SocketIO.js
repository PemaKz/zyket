const Service = require("../Service");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const fg = require('fast-glob');
const Handler = require("./Handler");
const Guard = require("./Guard");


module.exports = class SocketIO extends Service {
  #container;
  io;
  guards = {};
  
  constructor(container) {
    super("socketio");
    this.#container = container;
  }

  async boot({ httpServer } = {}) {
    const guards = await this.#loadGuardsFromFolder(path.join(process.cwd(), "src", "guards"));
    for (const guard of guards) {
      this.guards[guard.name] = guard;
    }
    const handlers = await this.#loadHandlersFromFolder(path.join(process.cwd(), "src", "handlers"));
    const connectionHandler = new (await this.#loadConnectionHandler())();


    this.#container.get('logger').debug(`Guards: ${guards.map(mdl => mdl.name).join(", ")}`);
    this.#container.get('logger').debug(`Handlers: ${handlers.map(hdl => hdl.event).join(", ")}`);
    
    this.io = new Server({ cors: { origin: "*" }, maxHttpBufferSize: 10 * 1024 * 1024 });

    this.io.on("connection", (socket) => {
      const connectionGuards = (connectionHandler?.guards || []).map(mdl => this.guards[mdl])
      for (const guard of connectionGuards) {
        if(!guard) {
          this.#container.get('logger').warn(`You are using a guard that does not exist`);
          continue;
        }
        guard.handle({ container: this.#container, socket, io: this.io });
      }
      connectionHandler.handle({ container: this.#container, socket, io: this.io });
      handlers.forEach((handler) => {
        const handlerGuards = (handler?.guards || []).map(mdl => this.guards[mdl])
        socket.on(handler.event, async (data) => {
          this.#container.get('logger').debug(`[${socket?.id}] Sent ${handler.event} with guards: ${handlerGuards?.map(mdl => mdl?.name).join(", ")}`);
          for (const guard of handlerGuards) {
            if(!guard) {
              this.#container.get('logger').warn(`You are using a guard that does not exist`);
              continue;
            }
            await guard.handle({ container: this.#container, socket, io: this.io });
          }
          return await handler.handle({ container: this.#container, socket, data, io: this.io });
        });
      });
    });

    this.io.listen(httpServer);
    this.#container.get('logger').info(`Socket.IO is running on ws://localhost:${httpServer.address().port}`);
  }

  async #loadConnectionHandler() {
    const connectionHandlerExists  = fs.existsSync(path.join(process.cwd(), "src", "handlers", "connection.js"));
    if(!connectionHandlerExists) {
      this.#container.get('template-manager').installFile('default/src/handlers/connection', path.join(process.cwd(), "src", "handlers", "connection.js"));
    }
    return require(path.join(process.cwd(), "src", "handlers", "connection.js"));
  }

  async #loadHandlersFromFolder(handlersFolder) {
    this.#createHandlersFolder(handlersFolder);
    const handlers = (await fg('**/*.js', { cwd: handlersFolder, ignore: 'connection.js' })).map((hdr) => {
      const handler = require(path.join(handlersFolder, hdr));
      if(!(handler.prototype instanceof Handler)) throw new Error(`${hdr} is not a valid handler`);
      return new handler(hdr.replace('.js', ''));
    });
    return handlers;
  }

  #createHandlersFolder(handlersFolder, overwrite = false) {
    if (fs.existsSync(handlersFolder) && !overwrite) return;
    this.#container.get('logger').info(`Creating handlers folder at ${handlersFolder}`);
    fs.mkdirSync(handlersFolder);
    this.#container.get('template-manager').installFile('default/src/handlers/message', path.join(handlersFolder, "message.js"));
  }

  async #loadGuardsFromFolder(guardsFolder) {
    this.#createGuardsFolder(guardsFolder);
    const guards = await fg('**/*.js', { cwd: guardsFolder })
    
    return guards.map((gd) => {
      const guard = require(path.join(guardsFolder, gd));
      if(!(guard.prototype instanceof Guard)) throw new Error(`${gd} is not a valid guard`);
      return new guard(gd.replace('.js', ''));
    });
  }

  #createGuardsFolder(guardsFolder, overwrite = false) {
    if (fs.existsSync(guardsFolder) && !overwrite) return;
    this.#container.get('logger').info(`Creating guards folder at ${guardsFolder}`);
    fs.mkdirSync(guardsFolder);
    this.#container.get('template-manager').installFile('default/src/guards/default', path.join(guardsFolder, "default.js"));
  }

  stop() {
    this.io.close();
  }

  get sockets() {
    return Array.from(this.io.sockets.sockets.values());
  }
}