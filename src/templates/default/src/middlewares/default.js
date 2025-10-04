const { Middleware } = require("zyket");

module.exports = class DefaultMiddleware extends Middleware {
  async handle({ container, request, response, next }) {
    container.get("logger").info("Default middleware");
    next();
  }
};