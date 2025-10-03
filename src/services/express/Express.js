const Service = require("../Service");
const express = require("express");
const cors = require("cors");


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

    this.#httpServer.on("request", this.#app);

    this.#container.get('logger').info(`Express is running on http://localhost:${httpServer.address().port}`);
  }
}