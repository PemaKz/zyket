const Extension = require('../Extension');
const { createBullBoard } = require('@bull-board/api')
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter')
const { ExpressAdapter } = require('@bull-board/express')
const basicAuth = require('express-basic-auth')

module.exports = class BullBoardExtension  extends Extension {
  path;

  constructor({ path = '/bullboard' } = {}) {
    super("BullBoardExtension");
    this.path = path || '/bullboard';
  }

  load(container) {
    if (!container.get('bullmq')) return container.get('logger').warn('BullBoardExtension: bullmq service not found, skipping BullBoard setup');
    const bull = container.get('bullmq')
    const serverAdapter = new ExpressAdapter()
    serverAdapter.setBasePath(this.path)

    createBullBoard({
      queues: Object.values(bull.queues).map(queue => new BullMQAdapter(queue)),
      serverAdapter
    })

    const app = container.get('express').app()
    const middlewares = []

    if (process.env.BULLBOARD_ADMIN_PASSWORD) {
      middlewares.push(basicAuth({
        users: { admin: process.env.BULLBOARD_ADMIN_PASSWORD },
        challenge: true,
      }))
    }

    app.use(this.path, ...middlewares, serverAdapter.getRouter())
  }
}