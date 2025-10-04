module.exports = class Guard {
  name;
  
  constructor(name) {
    this.name = name;
  }

  async handle({ container, socket}) {
    throw new Error("Method 'handle' must be implemented.");
  }
}