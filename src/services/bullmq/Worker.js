module.exports = class Worker {
  name;
  queueName = null;

  // Per-instance configuration. Controls how many BullMQ workers are spawned
  // for this class and what extra info each one receives:
  //   - number  -> spawns N identical instances (instance = {} for each)
  //   - array   -> spawns one instance per entry, each entry passed to handle()
  //                as `instance` (e.g. [{ proxy: '...' }, { proxy: '...' }])
  //   - function({ container }) -> resolved at boot, must return a number/array
  //                (e.g. load the proxy list from env/DB dynamically)
  //   - empty   -> a single default instance
  instances = [];

  // BullMQ Worker options (e.g. { concurrency: 5 }). Can be:
  //   - object   -> applied to every instance
  //   - function({ container, instance, index }) -> resolved at boot per
  //                instance (sync or async), so options can be computed
  //                dynamically (per-proxy concurrency, env-driven values, ...)
  options = {};

  constructor(name) {
    this.name = name;
  }
}
