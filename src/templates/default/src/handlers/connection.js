const { Handler } = require("zyket");

module.exports = class ConnectionHandler extends Handler {
  async handle({ container, socket, io }) {
    container.get("logger").info("New connection");
  }
};