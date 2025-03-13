module.exports = class Middleware {
  name;
  
  constructor(name) {
    this.name = name;
  }

  async handle({ container, socket}) {
    throw new Error("Method 'handle' must be implemented.");
  }
}