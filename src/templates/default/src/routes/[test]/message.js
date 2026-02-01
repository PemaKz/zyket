const { Route } = require("zyket");
const DefaultMiddleware = require("../../middlewares/default");

module.exports = class DefaultRoute extends Route {
  middlewares = {
    post: [ new DefaultMiddleware() ],
    get: [ new DefaultMiddleware() ]
  }

  async post({ container, request }) {
    const { test } = request.params;
    container.get("logger").info("Default route GET");

    return {
      test: "Hello World GET! Param: " + test
    }
  }

  async get({ container, request }) {
    const { test } = request.params;
    container.get("logger").info("Default route GET");
    
    return {
      test: "Hello World GET! Param: " + test
    }
  }
};