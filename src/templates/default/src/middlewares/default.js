const { Middleware } = require("zyket");
module.exports = class DefaultMiddleware extends Middleware {
  async handle({ container, socket, io }) {
    container.get("logger").info("Default middleware");
  }
};