module.exports = class Handler {
  event;
  
  constructor(event) {
    this.event = event;
  }

  handle({ container, socket, data }) {
    throw new Error("You should implement 'handle()' method on your handler");
  }
}