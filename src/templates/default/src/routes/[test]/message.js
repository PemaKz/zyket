const { Route } = require("zyket");

module.exports = class DefaultRoute extends Route {
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