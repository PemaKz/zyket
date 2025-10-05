# Zyket

Zyket is a Node.js framework designed to simplify the development of real-time applications with Socket.IO and Express. Inspired by the structured approach of frameworks like Symfony, Zyket provides a robust, service-oriented architecture for building scalable and maintainable server-side applications.

Upon initial boot, Zyket automatically scaffolds a default project structure, including handlers, routes, and configuration files, allowing you to get started immediately.

## Getting Started

To begin using Zyket, install it in your project:

```bash
npm i zyket
```

Then, create an `index.js` file and boot the Zyket Kernel:

```javascript
// index.js
const { Kernel } = require("zyket");

// Instantiate the kernel
const kernel = new Kernel();

// Boot the kernel to start all services
kernel.boot().then(() => {
    console.log("Kernel booted successfully!");
});
```

When you run this for the first time, Zyket will create a default `.env` file and a `src` directory containing boilerplate for routes, handlers, guards, and middlewares.

## Core Concepts

Zyket is built around a few key architectural concepts:

*   **Socket.IO Handlers & Guards**: For managing real-time WebSocket events and their authorization.
*   **Express Routes & Middlewares**: For handling traditional RESTful API endpoints.
*   **Services**: Reusable components that are managed by a dependency injection container.
*   **CLI**: A command-line tool to scaffold features from templates.

### Socket.IO Development

#### Handlers

Handlers are classes that process incoming Socket.IO events. The name of the handler file (e.g., `message.js`) determines the event it listens to (`message`).

```javascript
// src/handlers/message.js
const { Handler } = require("zyket");

module.exports = class MessageHandler extends Handler {
  // Array of guard names to execute before the handler
  guards = ["default"];

  async handle({ container, socket, data, io }) {
    const logger = container.get("logger");
    logger.info(`Received message: ${JSON.stringify(data)}`);
    socket.emit("response", { received: data });
  }
};
```

#### Guards

Guards are used to protect Socket.IO handlers or the initial connection. They run before the handler's `handle` method and are ideal for authorization logic.

```javascript
// src/guards/default.js
const { Guard } = require("zyket");

module.exports = class DefaultGuard extends Guard {
  async handle({ container, socket, io }) {
    container.get("logger").info(`Executing default guard for socket ${socket.id}`);
    
    // Example: Check for an auth token. If invalid, disconnect the user.
    // if (!socket.token) {
    //   socket.disconnect();
    // }
  }
};
```

### Express API Development

#### Routes

Routes handle HTTP requests. The file path maps directly to the URL endpoint. For example, `src/routes/index.js` handles requests to `/`, and `src/routes/[test]/message.js` handles requests to `/:test/message`.

```javascript
// src/routes/index.js
const { Route } = require("zyket");
const DefaultMiddleware = require("../middlewares/default");

module.exports = class DefaultRoute extends Route {
  // Apply middlewares to specific HTTP methods
  middlewares = {
    get: [ new DefaultMiddleware() ],
    post: [ new DefaultMiddleware() ]
  }

  async get({ container, request }) {
    container.get("logger").info("Default route GET");
    return { test: "Hello World GET!" };
  }

  async post({ container, request }) {
    container.get("logger").info("Default route POST");
    return { test: "Hello World POST!" };
  }
};
```

#### Middlewares

Middlewares process the request before it reaches the route handler. They follow the standard Express middleware pattern.

```javascript
// src/middlewares/default.js
const { Middleware } = require("zyket");

module.exports = class DefaultMiddleware extends Middleware {
  async handle({ container, request, response, next }) {
    container.get("logger").info("Default Express middleware executing");
    next(); // Pass control to the next middleware or route handler
  }
};
```

## Services

Services are the cornerstone of Zyket's architecture, providing reusable functionality across your application. Zyket includes several default services and allows you to register your own.

### Custom Services

You can create your own services by extending the `Service` class and registering it with the Kernel.

```javascript
// src/services/MyCustomService.js
const { Service } = require("zyket");

module.exports = class MyCustomService extends Service {
    constructor() {
        super("my-custom-service");
    }

    async boot() {
        console.log("MyCustomService has been booted!");
    }

    doSomething() {
        return "Something was done.";
    }
}
```

Register the service in your main `index.js` file:

```javascript
// index.js
const { Kernel } = require("zyket");
const MyCustomService = require("./src/services/MyCustomService");

const kernel = new Kernel({
    services: [
        // [name, class, [constructor_args]]
        ["my-service", MyCustomService, []]
    ]
});

kernel.boot();
```
Services are reusable components specified in the kernel configuration. Each service must include a boot() function that is executed when the kernel starts.

```javascript
module.exports = class LoggerService {
    this.#container;
    
    boot(container, enableLogging = true) {
        this.#container = container;
        console.log("LoggerService Booted");
    }

    info(message) {
        if(!enableLogging) return;
        console.log(`[INFO]: ${message}`);
    }
};
```

Then, when booting the kernel, specify the service:

```javascript
const { Kernel } = require("zyket");
const LoggerService = require("./LoggerService");

const kernel = new Kernel({
    services: [["logger", LoggerService, ['@service_container', true]],
});

kernel.boot().then(() => console.log(`Kernel Booted`));
```

## Default Services
Zyket includes some default services that provide essential functionality. These services can be overridden or extended if needed.

#### Cache Services
- **Name** `cache`
- **Description** Provides caching functionality using a Redis adapter.
- **Configuration** Add `CACHE_URL` in your `.env` file to activate caching.

#### Database Service
- **Name** `database`
- **Description** Manages database connections using a MariaDB/Sequelize adapter.
- **Configuration** Add `DATABASE_URL` in your `.env` file to enable the database connection.

#### S3 Service
- **Name** `s3`
- **Description** Provides S3-compatible object storage using MinIO.
- **Configuration** Add the following variables in your `.env` file to enable the service
    - `S3_ENDPOINT`
    - `S3_PORT`
    - `S3_USE_SSL`
    - `S3_ACCESS_KEY`
    - `S3_SECRET_KEY`

#### Logger Service
- **Name** `logger`
- **Description** Handles logging for the application.
- **Configuration**
    - Change `LOG_DIRECTORY` in `.env` file to set a custom log directory.
    - Set `DEBUG` in `.env` file to enable or disable debug logging.

#### Socket.io Service
- **Name** `socketio`
- **Description** Manages the WebSocket server.
- **Configuration** Add `PORT` in your `.env` file to define the listening port for Socket.io.


## Contributing

We welcome contributions from the community! If you'd like to improve Zyket, feel free to:

- Report issues and suggest features on GitHub Issues

- Submit pull requests with bug fixes or enhancements

- Improve the documentation

Let's build a better framework together! 🚀

