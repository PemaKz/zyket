module.exports = class Service {
  name = null;
  
  constructor(name) {
    this.name = name;
  }

  async boot() {
    throw new Error("Method 'boot' must be implemented.");
  }
}