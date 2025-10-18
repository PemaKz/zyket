module.exports = class Worker {
  name;
  queueName = null;
  
  constructor(name) {
    this.name = name;
  }
}