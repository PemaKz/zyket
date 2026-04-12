const Service = require("../Service");
const { createClient } = require("redis");

module.exports = class Cache extends Service {
  #container;
  #client;
  #useRedis;
  #memoryCache;
  #expirations;

  constructor(container, url) {
    super("cache");
    this.#container = container;
    this.#useRedis = !!url && url !== '';
    
    if (this.#useRedis) {
      this.#client = createClient({ url });
    } else {
      // Use in-memory cache
      this.#memoryCache = new Map();
      this.#expirations = new Map();
    }
  }

  async boot() {
    if (this.#useRedis) {
      await this.#client.connect();
      this.#container.get('logger').info('Cache service using Redis');
    } else {
      this.#container.get('logger').info('Cache service using in-memory cache');
    }
  }

  async set(key, value) {
    if (this.#useRedis) {
      return await this.#client.set(key, value);
    } else {
      this.#memoryCache.set(key, value);
      return 'OK';
    }
  }

  async get(key) {
    if (this.#useRedis) {
      return await this.#client.get(key);
    } else {
      // Check if the key has expired
      if (this.#expirations.has(key)) {
        const expireTime = this.#expirations.get(key);
        if (Date.now() > expireTime) {
          this.#memoryCache.delete(key);
          this.#expirations.delete(key);
          return null;
        }
      }
      return this.#memoryCache.get(key) || null;
    }
  }

  async del(key) {
    if (this.#useRedis) {
      return await this.#client.del(key);
    } else {
      this.#expirations.delete(key);
      return this.#memoryCache.delete(key) ? 1 : 0;
    }
  }

  async keys(pattern) {
    if (this.#useRedis) {
      return await this.#client.keys(pattern);
    } else {
      // Simple pattern matching for memory cache
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(this.#memoryCache.keys()).filter(key => regex.test(key));
    }
  }

  async expire(key, seconds) {
    if (this.#useRedis) {
      return await this.#client.expire(key, seconds);
    } else {
      if (this.#memoryCache.has(key)) {
        const expireTime = Date.now() + (seconds * 1000);
        this.#expirations.set(key, expireTime);
        return 1;
      }
      return 0;
    }
  }

  get client() {
    return this.#useRedis ? this.#client : null;
  }
}