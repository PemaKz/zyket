# Create a Zyket Custom Service

Create a new custom service in the Zyket project.

## Instructions

Custom services extend the `Service` base class and are registered in the `Kernel` constructor. They are booted once at startup and accessible anywhere via `container.get("serviceName")`.

### Template

```js
// src/services/$name$.js
const { Service } = require("zyket");

module.exports = class $Name$Service extends Service {
  #container;

  constructor(container) {
    super("$name$"); // Must match the registration name
    this.#container = container;
  }

  async boot() {
    // Initialize any connections, clients, etc.
    this.#container.get("logger").info("$Name$Service booted");
  }

  // Add your service methods here
};
```

### Registration

```js
// index.js
const { Kernel } = require("zyket");
const $Name$Service = require("./src/services/$name$");

const kernel = new Kernel({
  services: [
    ["$name$", $Name$Service, ["@service_container"]],
  ],
});

kernel.boot();
```

### Usage

```js
const service = container.get("$name$");
```

### Steps:
1. Create `src/services/$name$.js`.
2. Implement the `boot()` method for initialization.
3. Add the service methods.
4. Register it in `index.js` with a unique name.
5. Use `"@service_container"` in the args array to inject the DI container.
