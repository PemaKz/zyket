# ZYKET - Easy Socket.io Framework

Zyket is a framework inspired by Symfony that simplifies working with Socket.io by providing a structured approach.

# Getting Started

To use zyket we need to install it into our project:

```javascript
npm i zyket
```

Then we just need to import the Kernel and boot it:

```javascript
const { Kernel } = require("zyket");
const kernel = new Kernel();

kernel.boot().then(() => console.log(`Kernel Booted`));
```

After boot is done for fist time, project folders/files will be created if doesnt exists.

## Handlers

Handlers are the way to interact with user messages on the socket:
```javascript
const { Handler } = require("zyket");

module.exports = class MessageHandler extends Handler {
    middlewares = ["default"];

    async handle({ container, socket, data, io }) {
        container.get("logger").info("Message handler");
    }
};
```

- middlewares: An array of middleware names that should be executed before the handler.

- handle(): The function that processes the event, receiving container, socket, and data.

## Middlewares

Middlewares allow you to process data before it reaches the handler. They can be used for validation, authentication, logging, etc.

```javascript
const { Middleware } = require("zyket");

module.exports = class DefaultMiddleware extends Middleware {
    async handle({ container, socket, io }) {
        container.get("logger").info("Default middleware");
    }
};
```

- handle(): The function that processes the event, receiving container, socket, and data.


## Services
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

