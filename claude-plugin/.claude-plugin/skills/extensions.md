# Zyket – Extensions

Extensions are plugins that hook into the Kernel after all services have booted. They can register routes, middlewares, and other integrations on top of the existing service container.

## Creating an Extension

Extend the `Extension` base class and implement the `load(container)` method:

```js
// src/extensions/my-extension.js
const { Extension } = require("zyket");

module.exports = class MyExtension extends Extension {
  constructor() {
    super("MyExtension"); // extension name
  }

  async load(container) {
    const express = container.get("express");

    // Register additional routes dynamically
    await express.registerRoutes([
      new MyCustomRoute("/my-extension/status"),
    ]);

    container.get("logger").info("MyExtension loaded");
  }
};
```

## Registering Extensions

Pass extension instances to the `Kernel` constructor:

```js
// index.js
const { Kernel, BullBoardExtension, InteractiveStorageExtension } = require("zyket");
const MyExtension = require("./src/extensions/my-extension");

const kernel = new Kernel({
  extensions: [
    new BullBoardExtension(),
    new InteractiveStorageExtension(),
    new MyExtension(),
  ],
});

kernel.boot();
```

## Built-in Extensions

### BullBoardExtension

Provides the Bull Board admin UI at `/admin/queues`.

```js
const { BullBoardExtension } = require("zyket");
new BullBoardExtension()
```

### InteractiveStorageExtension

Provides a file-browser REST API backed by S3/MinIO. See the services skill for the full endpoint list.

```js
const { InteractiveStorageExtension } = require("zyket");
new InteractiveStorageExtension()
```

## Rules

- Extensions are loaded **after** all services have booted, so `container.get(...)` is safe to call inside `load()`.
- The `load()` method can be async.
- Passing something that is not an instance of `Extension` to the `extensions` array throws an error on boot.
