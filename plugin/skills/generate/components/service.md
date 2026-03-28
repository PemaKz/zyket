# Service

Custom service with dependency injection. Long-running components that provide shared functionality across the application.

## Location

No fixed location — services are manually registered in the Kernel constructor.

## Base Class

`Service` from `zyket`

## Template

```js
const { Service } = require("zyket");

module.exports = class MyService extends Service {
  #container;

  constructor(container) {
    super("my-service"); // name used with container.get()
    this.#container = container;
  }

  async boot({ httpServer } = {}) {
    // Called during kernel boot
    // Initialize connections, load config, set up state
  }

  // Public API methods
}
```

## Registration

Services are registered in the Kernel constructor as a tuple: `[name, class, args]`.

```js
const { Kernel } = require("zyket");
const MyService = require("./services/MyService");

const kernel = new Kernel({
  services: [
    ["my-service", MyService, ["@service_container"]]
  ]
});
```

## Special Arguments

| Placeholder | Replaced With |
|------------|---------------|
| `"@service_container"` | The DI `ContainerBuilder` instance |

## Boot Signature

| Param | Type | Description |
|-------|------|-------------|
| `httpServer` | `http.Server` | The underlying HTTP server |

## Accessing From Other Components

```js
const myService = container.get("my-service");
```
