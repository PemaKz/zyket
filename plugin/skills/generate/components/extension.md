# Extension

Post-boot plugin with full container access. Integrates with booted services to add features like dashboards, file browsers, or third-party integrations.

## Location

No fixed location — extensions are manually registered in the Kernel constructor.

## Base Class

`Extension` from `zyket`

## Template

```js
const { Extension } = require("zyket");

module.exports = class MyExtension extends Extension {
  constructor(options = {}) {
    super("MyExtension"); // extension display name
    // Store any configuration options
  }

  async load(container) {
    // Runs after all services have booted
    // Full access to every service via container
  }
}
```

## Registration

```js
const { Kernel } = require("zyket");
const MyExtension = require("./extensions/MyExtension");

const kernel = new Kernel({
  extensions: [new MyExtension({ path: "/my-ext" })]
});
```

## Method Signature

| Param | Type | Description |
|-------|------|-------------|
| `container` | `ContainerBuilder` | DI service container with all booted services |

## Common Patterns

### Registering additional routes

```js
async load(container) {
  const express = container.get('express');
  express.registerRoutes([new MyRoute("/custom-path")]);
}
```

### Registering a raw Express handler

```js
async load(container) {
  const express = container.get('express');
  express.regiterRawAllRoutes("/webhook", (req, res) => {
    res.send("OK");
  });
}
```

### Checking service availability

```js
async load(container) {
  if (!container.has('s3')) {
    return container.get('logger').warn('MyExtension: s3 service not found, skipping');
  }
}
```
