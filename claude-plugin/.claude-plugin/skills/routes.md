# Zyket – HTTP Routes

Zyket uses **file-based routing** for Express. Every `.js` file inside `src/routes/` automatically becomes an HTTP endpoint.

## Path Mapping Rules

| File path | HTTP path |
|---|---|
| `src/routes/index.js` | `/` |
| `src/routes/users.js` | `/users` |
| `src/routes/users/index.js` | `/users` |
| `src/routes/users/profile.js` | `/users/profile` |
| `src/routes/[id].js` | `/:id` |
| `src/routes/users/[id]/posts.js` | `/users/:id/posts` |

Use square brackets for dynamic segments: `[paramName]` → `:paramName`.

## Creating a Route

Extend the `Route` base class from `zyket`:

```js
// src/routes/users.js
const { Route } = require("zyket");

module.exports = class UsersRoute extends Route {
  async get({ container, request, response }) {
    const db = container.get("database");
    const users = await db.models.User.findAll();
    return { users };
  }

  async post({ container, request, response }) {
    const { name, email } = request.body;
    const db = container.get("database");
    const user = await db.models.User.create({ name, email });
    return { user, status: 201 };
  }
};
```

## Supported HTTP Methods

Implement any combination of `get`, `post`, `put`, `delete` as async methods on the class. Each receives `{ container, request, response }`.

## Return Values

The return value from a route method is automatically serialised as JSON:

```js
return { data: "hello" };
// → { success: true, data: "hello" }
```

Set a custom HTTP status code via the `status` property:

```js
return { message: "Created", status: 201 };
```

Return `false` for `success`:

```js
return { success: false, message: "Not found", status: 404 };
```

Return a `Buffer` to send a file download:

```js
return Buffer.from(fileContent);
```

Return a `RedirectResponse` to redirect:

```js
const { RedirectResponse } = require("zyket");
return new RedirectResponse("https://example.com");
```

## Attaching Middlewares to a Route

Define a `middlewares` object on the class to attach per-method middlewares:

```js
const { Route } = require("zyket");
const AuthMiddleware = require("../middlewares/auth");

module.exports = class SecureRoute extends Route {
  middlewares = {
    get: [new AuthMiddleware()],
    post: [new AuthMiddleware()],
  };

  async get({ container, request }) {
    return { user: request.user };
  }
};
```

Middlewares run in order before the route handler. If a middleware throws, Zyket returns a 500 JSON response.

## Route Parameters

```js
// src/routes/users/[id].js
async get({ container, request }) {
  const { id } = request.params;
  const user = await container.get("database").models.User.findByPk(id);
  if (!user) return { success: false, message: "User not found", status: 404 };
  return { user };
}
```

## Query Strings

```js
async get({ container, request }) {
  const { page = 1, limit = 10 } = request.query;
  // ...
}
```

## Swagger / OpenAPI Docs

Add JSDoc comments above each method using the OpenAPI 3.0 annotation format. Swagger UI is served at `/docs` (configurable via `SWAGGER_PATH` env var).

```js
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
async get({ container, request }) {
  // ...
}
```
