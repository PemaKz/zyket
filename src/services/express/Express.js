const Service = require("../Service");
const express = require("express");
const cors = require("cors");
const Route = require("./Route");
const fs = require("fs");
const path = require("path");
const fg = require('fast-glob');
const Middleware = require("./Middleware");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");


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

    const corsOptions = await this.#loadCorsOrCreateDefault();

    this.#app.use(cors(corsOptions));

    // Swagger setup
    const swaggerOptions = {
      ...(await this.#loadSwaggerOrCreateDefault()),
    };

    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    this.#app.use(process?.env?.SWAGGER_PATH || "/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
          ...middlewares.map(mw => async (req, res, next) => {
            try { 
              await mw.handle({ container: this.#container, request: req, response: res, next })
            } catch (error) {
              this.#container.get('logger').error(`Error in middleware for route [${methodName}] ${route.path}: ${error.message}`);
              return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
            }
          }), 
          async (req, res) => {
            try {
              const routeResponse = await route[methodName]({ container: this.#container, request: req, response: res });
              
              // Check if response is a buffer (file download)
              if (Buffer.isBuffer(routeResponse)) {
                const filename = req.query.filename || 'download';
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', 'application/octet-stream');
                return res.send(routeResponse);
              }
              
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

    // Attach Express to HTTP server - this allows dynamic route registration
    this.#httpServer.removeAllListeners("request");
    this.#httpServer.on("request", this.#app);

    this.#container.get('logger').info(`Express is running on http://localhost:${httpServer.address().port}`);
  }

  async registerRoutes(routes) {
    const methods = ['post', 'get', 'put', 'delete']
    for (const route of routes) {
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
          ...middlewares.map(mw => async (req, res, next) => {
            try { 
              await mw.handle({ container: this.#container, request: req, response: res, next })
            } catch (error) {
              this.#container.get('logger').error(`Error in middleware for route [${methodName}] ${route.path}: ${error.message}`);
              return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
            }
          }),
          async (req, res) => {
            try {
              const routeResponse = await route[methodName]({ container: this.#container, request: req, response: res });

              if (routeResponse instanceof RedirectResponse)  return res.redirect(routeResponse.url);
              
              // Check if response is a buffer (file download)
              if (Buffer.isBuffer(routeResponse)) {
                const filename = req.query.filename || 'download';
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', 'application/octet-stream');
                return res.send(routeResponse);
              }
              
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
    }
    
    this.#httpServer.removeAllListeners("request");
    this.#httpServer.on("request", this.#app);
  }

  async regiterRawAllRoutes(path, handler) {
    this.#app.all(path, handler);

    this.#httpServer.removeAllListeners("request");
    this.#httpServer.on("request", this.#app);
  }

  async #loadCorsOrCreateDefault() {
    let corsOptions = {};
    const corsConfigPath = path.join(process.cwd(), "config", "cors.js");
    if (fs.existsSync(corsConfigPath)) {
      this.#container.get('logger').info("Loading CORS configuration from config/cors.js");
      corsOptions = require(corsConfigPath);
    } else {
      this.#container.get('logger').info("No CORS configuration found. Creating default config/cors.js");
      fs.mkdirSync(path.join(process.cwd(), "config"), { recursive: true });
      this.#container.get('template-manager').installFile('default/config/cors', corsConfigPath);
      corsOptions = { origin: '*' };
    }
    return corsOptions;
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

  async #loadSwaggerOrCreateDefault() {
    let swaggerOptions = {};
    const swaggerConfigPath = path.join(process.cwd(), "config", "swagger.js");
    if (fs.existsSync(swaggerConfigPath)) {
      this.#container.get('logger').info("Loading Swagger configuration from config/swagger.js");
      swaggerOptions = require(swaggerConfigPath);
    } else {
      this.#container.get('logger').info("No Swagger configuration found. Creating default config/swagger.js");
      fs.mkdirSync(path.join(process.cwd(), "config"), { recursive: true });
      this.#container.get('template-manager').installFile('default/config/swagger', swaggerConfigPath);
      swaggerOptions = {
        swaggerDefinition: {
          openapi: '3.0.0',
          info: {
            title: "API Documentation",
            version: require(path.join(process.cwd(), "package.json")).version || "1.0.0",
            description: "API Documentation generated by Swagger",
          },
          servers: [
            { url: `http://localhost:3000` }
          ],
        },
        apis: [path.join(process.cwd(), "src", "routes", "**", "*.yml")]
      };
    }
    return swaggerOptions;
  }
      

  app() {
    return this.#app;
  }
}