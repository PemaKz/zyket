# Middleware

HTTP middleware. Runs before route handlers to validate, transform, or block requests.

## Location

`src/middlewares/<name>.js`

Middlewares are **not auto-discovered**. They must be imported and attached to routes manually.

## Base Class

`Middleware` from `zyket`

## Template

```js
const { Middleware } = require("zyket");

module.exports = class extends Middleware {
  handle({ container, request, response, next }) {
    // Call next() to pass control to the next middleware or route handler
    // Or respond directly to block the request
    next();
  }
}
```

## Method Signature

| Param | Type | Description |
|-------|------|-------------|
| `container` | `ContainerBuilder` | DI service container |
| `request` | `Request` | Express request object |
| `response` | `Response` | Express response object |
| `next` | `Function` | Call to continue the chain |

## Usage in Routes

```js
const { Route } = require("zyket");
const AuthMiddleware = require("../middlewares/auth");

module.exports = class extends Route {
  middlewares = {
    get: [new AuthMiddleware()],
    post: [new AuthMiddleware()]
  }

  async get({ container, request }) { }
}
```
