const Service = require("../Service");
const { createClient } = require("redis");

module.exports = class Cache extends Service {
  #container;
  client;

  constructor(container, url) {
    super("cache");
    this.#container = container;
    this.client = createClient({ url });
  }

  async boot() {
    await this.client.connect();
  }

  async set(key, value) {
    return await this.client.set(key, value);
    
  }

  async get(key) {
    return await this.client.get(key);
  }

  async del(key) {
    return await this.client.del(key);
  }

  async keys(pattern) {
    return await this.client.keys(pattern);
  }

  async expire(key, seconds) {
    return await this.client.expire(key, seconds);
  }
}