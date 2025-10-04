module.exports = class Middleware {
  constructor() {
  }

  handle({ container, request, response, next }) {
    throw new Error("You should implement 'handle()' method on your route");
  }
}