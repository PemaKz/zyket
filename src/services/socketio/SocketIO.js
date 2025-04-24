const Service = require("../Service");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const fg = require('fast-glob');
const Handler = require("./Handler");
const Middleware = require("./Middleware");


module.exports = class SocketIO extends Service {
  port;
  #container;
  io;
  middlewares = {};
  
  constructor(container, port, onConnection = () => { }) {
    super("socketio");
    this.port = port || 3000;
    this.#container = container;
  }

  async boot() {
    const middlewares = await this.#loadMiddlewaresFromFolder(path.join(process.cwd(), "src", "middlewares"));
    for (const middleware of middlewares) {
      this.middlewares[middleware.name] = middleware;
    }
    const handlers = await this.#loadHandlersFromFolder(path.join(process.cwd(), "src", "handlers"));
    const connectionHandler = new (await this.#loadConnectionHandler())();


    this.#container.get('logger').debug(`Middlewares: ${middlewares.map(mdl => mdl.name).join(", ")}`);
    this.#container.get('logger').debug(`Handlers: ${handlers.map(hdl => hdl.event).join(", ")}`);
    
    this.io = new Server({ cors: { origin: "*" }, maxHttpBufferSize: 10 * 1024 * 1024 });

    this.io.on("connection", (socket) => {
      const connectionMiddlewares = (connectionHandler?.middlewares || []).map(mdl => this.middlewares[mdl])
      for (const middleware of connectionMiddlewares) {
        if(!middleware) {
          this.#container.get('logger').warn(`You are using a middleware that does not exist`);
          continue;
        }
        middleware.handle({ container: this.#container, socket, io: this.io });
      }
      connectionHandler.handle({ container: this.#container, socket, io: this.io });
      handlers.forEach((handler) => {
        const handlerMiddlewares = (handler?.middlewares || []).map(mdl => this.middlewares[mdl])
        socket.on(handler.event, async (data) => {
          this.#container.get('logger').debug(`[${socket?.id}] Sent ${handler.event} with middlewares: ${handlerMiddlewares?.map(mdl => mdl?.name).join(", ")}`);
          for (const middleware of handlerMiddlewares) {
            if(!middleware) {
              this.#container.get('logger').warn(`You are using a middleware that does not exist`);
              continue;
            }
            await middleware.handle({ container: this.#container, socket, io: this.io });
          }
          return await handler.handle({ container: this.#container, socket, data, io: this.io });
        });
      });
    });

    this.io.listen(this.port);
    this.#container.get('logger').info(`Socket.IO is running on port ws://localhost:${this.port}`);
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
    // need to read all files and subfolders
    const handlers = (await fg('**/*.js', { cwd: handlersFolder, ignore: 'connection.js' })).map((hdr) => {
      // should be type handler
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

  async #loadMiddlewaresFromFolder(middlewaresFolder) {
    this.#createMiddlewaresFolder(middlewaresFolder);
    // need to read all files and subfolders
    const middlewares = await fg('**/*.js', { cwd: middlewaresFolder })
    
    return middlewares.map((mdl) => {
      // should be type middleware
      const middleware = require(path.join(middlewaresFolder, mdl));
      if(!(middleware.prototype instanceof Middleware)) throw new Error(`${mdl} is not a valid middleware`);
      return new middleware(mdl.replace('.js', ''));
    });
  }

  #createMiddlewaresFolder(middlewaresFolder, overwrite = false) {
    if (fs.existsSync(middlewaresFolder) && !overwrite) return;
    this.#container.get('logger').info(`Creating middlewares folder at ${middlewaresFolder}`);
    fs.mkdirSync(middlewaresFolder);
    this.#container.get('template-manager').installFile('default/src/middlewares/default', path.join(middlewaresFolder, "default.js"));
  }

  stop() {
    this.io.close();
  }

  sockets() {
    return Object.keys(this.io.sockets.sockets).map((socketId) => {
      return this.io.sockets.sockets[socketId];
    });
  }
}