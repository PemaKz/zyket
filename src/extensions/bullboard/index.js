const Extension = require('../Extension');
const { createBullBoard } = require('@bull-board/api')
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter')
const { ExpressAdapter } = require('@bull-board/express')
const basicAuth = require('express-basic-auth')

module.exports = class BullBoardExtension  extends Extension {
  path;

  constructor({ path = '/bullboard', basePath = '', middlewares = [] } = {}) {
    super("BullBoardExtension");
    this.path = path || '/bullboard';
    this.basePath = basePath;
    // Optional Express middlewares (e.g. custom auth) applied before the board.
    this.middlewares = middlewares || [];
  }

  load(container) {
    const logger = container.get('logger')
    if (!container.get('bullmq')) return logger.warn('BullBoardExtension: bullmq service not found, skipping BullBoard setup');
    const bull = container.get('bullmq')
    const serverAdapter = new ExpressAdapter()
    serverAdapter.setBasePath(this.basePath + this.path)

    createBullBoard({
      queues: Object.values(bull.queues).map(queue => new BullMQAdapter(queue)),
      serverAdapter
    })

    const app = container.get('express').app()
    const middlewares = [...this.middlewares]

    if (process.env.BULLBOARD_ADMIN_PASSWORD) {
      middlewares.push(basicAuth({
        users: { admin: process.env.BULLBOARD_ADMIN_PASSWORD },
        challenge: true,
      }))
    }

    // Fail closed: never expose the queue dashboard (jobs, payloads, retry/delete)
    // without authentication. Require a password or custom auth middlewares.
    if (middlewares.length === 0) {
      return logger.warn(
        `BullBoardExtension: no authentication configured. Set BULLBOARD_ADMIN_PASSWORD or pass "middlewares" to expose the dashboard. Skipping mount of ${this.path}.`
      )
    }

    app.use(this.path, ...middlewares, serverAdapter.getRouter())
  }
}