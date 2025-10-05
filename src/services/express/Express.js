const Service = require("../Service");
const express = require("express");
const cors = require("cors");
const Route = require("./Route");
const fs = require("fs");
const path = require("path");
const fg = require('fast-glob');
const Middleware = require("./Middleware");


module.exports = class Express extends Service {
  #container;
  #app;
  #httpServer;

  constructor(container) {
    super("express");
    this.#container = container;
  }

  async boot({ httpServer } = {}) {
    if (!httpServer) {
      throw new Error("HTTP server is not available");
    }

    this.#httpServer = httpServer;
    this.#app = express();

    this.#app.use(express.json({ limit: `100mb` }))
    this.#app.use(cors({
      origin: '*'
    }))

    const routes = await this.#loadRoutesFromFolder(path.join(process.cwd(), "src", "routes"));

    routes.forEach((route) => {
      const methods = ['post', 'get', 'put', 'delete']
      for (const methodName of methods) {
        const method = route[methodName];
        if(!method) continue;
        this.#container.get('logger').debug(`Registering route: [${methodName}] ${route.path}`);
        const middlewares = route?.middlewares?.[methodName] || [];
        for (const mw of middlewares) {
          if (!(mw instanceof Middleware)) {
            throw new Error(`Middleware for route ${route.path} is not an instance of Middleware`);
          }
        }
        
        this.#app[methodName](
          route.path, 
          ...middlewares.map(mw => (req, res, next) => mw.handle({ container: this.#container, request: req, response: res, next })), 
          async (req, res) => {
            try {
              const routeResponse = await route[methodName]({ container: this.#container, request: req, response: res });
              const status = routeResponse?.status || 200;
              return res.status(status).json({
                ...routeResponse,
                success: routeResponse?.success !== false,
              });
            } catch (error) {
              this.#container.get('logger').error(`Error in route [${methodName}] ${route.path}: ${error.message}`);
              return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
            }
          });
        }
    });

    this.#httpServer.on("request", this.#app);

    this.#container.get('logger').info(`Express is running on http://localhost:${httpServer.address().port}`);
  }

  async #loadRoutesFromFolder(routesFolder) {
    this.#createRoutesFolder(routesFolder);
    const routes = (await fg('**/*.js', { cwd: routesFolder })).map((rt) => {
    const route = require(path.join(routesFolder, rt));
      if(!(route.prototype instanceof Route)) throw new Error(`${rt} is not a valid route`);
      let routePath = `/${rt.replace('.js', '')}`;
      routePath = routePath.replaceAll('index', '/');
      routePath = routePath.replaceAll('//', '/');
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      
      return new route(routePath);
    });
    return routes;
  }

  #createRoutesFolder(routesFolder, overwrite = false) {
    if (fs.existsSync(routesFolder) && !overwrite) return;
    this.#container.get('logger').info(`Creating routes folder at ${routesFolder}`);
    fs.mkdirSync(routesFolder);
    this.#container.get('template-manager').installFile('default/src/routes/index', path.join(routesFolder, "index.js"));
    fs.mkdirSync(path.join(routesFolder, "[test]"));
    this.#container.get('template-manager').installFile('default/src/routes/[test]/message', path.join(routesFolder, "[test]", "message.js"));
    fs.mkdirSync(path.join(process.cwd(), "src", "middlewares"));
    this.#container.get('template-manager').installFile('default/src/middlewares/default', path.join(process.cwd(), "src", "middlewares", "default.js"));
  }
}