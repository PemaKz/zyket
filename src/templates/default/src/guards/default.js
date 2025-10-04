const { Guard } = require("zyket");

module.exports = class DefaultGuard extends Guard {
  async handle({ container, socket, io }) {
    container.get("logger").info("Default guard");
  }
};