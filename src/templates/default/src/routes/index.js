const { Route } = require("zyket");
const DefaultMiddleware = require("../middlewares/default");

module.exports = class DefaultRoute extends Route {
  middlewares = {
    post: [ new DefaultMiddleware() ],
    get: [ new DefaultMiddleware() ]
  }

  async post({ container, request }) {
    container.get("logger").info("Default route POST");
    return {
      test: "Hello World POST!"
    }
  }

  async get({ container, request }) {
    container.get("logger").info("Default route GET");
    return {
      test: "Hello World GET!"
    }
  }
};