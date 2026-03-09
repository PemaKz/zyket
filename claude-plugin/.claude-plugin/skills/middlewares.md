# Zyket – Middlewares

Middlewares in Zyket are class-based and run before route handlers. They are attached to routes per HTTP method.

## Creating a Middleware

Extend the `Middleware` base class from `zyket` and implement the `handle` method:

```js
// src/middlewares/auth.js
const { Middleware } = require("zyket");

module.exports = class AuthMiddleware extends Middleware {
  async handle({ container, request, response, next }) {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return response.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Verify token, attach user to request, etc.
    request.user = await verifyToken(token);
    next();
  }
};
```

## Rules

- **Always call `next()`** if the middleware should allow the request to continue.
- **Return early** (calling `response.status(...).json(...)`) to block the request.
- Throwing an exception causes Zyket to return a `500` JSON response.
- Middleware classes are instantiated once and reused.

## Attaching to Routes

Pass middleware instances in the route's `middlewares` object keyed by HTTP method:

```js
const { Route } = require("zyket");
const AuthMiddleware = require("../middlewares/auth");
const RateLimitMiddleware = require("../middlewares/rate-limit");

module.exports = class PostsRoute extends Route {
  middlewares = {
    get: [new AuthMiddleware()],
    post: [new AuthMiddleware(), new RateLimitMiddleware()],
  };

  async get({ container, request }) { /* ... */ }
  async post({ container, request }) { /* ... */ }
};
```

## Common Middleware Patterns

### Validate request body

```js
const { Middleware } = require("zyket");

module.exports = class ValidateBodyMiddleware extends Middleware {
  async handle({ container, request, response, next }) {
    const { name, email } = request.body;
    if (!name || !email) {
      return response.status(400).json({ success: false, message: "name and email are required" });
    }
    next();
  }
};
```

### Log incoming requests

```js
const { Middleware } = require("zyket");

module.exports = class LogRequestMiddleware extends Middleware {
  async handle({ container, request, response, next }) {
    container.get("logger").info(`${request.method} ${request.path}`);
    next();
  }
};
```

### Check a permission

```js
const { Middleware } = require("zyket");

module.exports = class AdminMiddleware extends Middleware {
  async handle({ container, request, response, next }) {
    if (request.user?.role !== "admin") {
      return response.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  }
};
```
