const { Handler } = require("zyket");

module.exports = class MessageHandler extends Handler {
  middlewares = ["default"];

  async handle({ container, socket, data, io }) {
    container.get("logger").info("Message handler");
  }
};