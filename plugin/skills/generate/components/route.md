# Route

HTTP endpoint. Handles REST API requests via Express.

## Location

`src/routes/<path>.js` — the file path maps to the **URL path**:

| File | URL |
|------|-----|
| `src/routes/index.js` | `/` |
| `src/routes/users.js` | `/users` |
| `src/routes/users/[id].js` | `/users/:id` |
| `src/routes/auth/login.js` | `/auth/login` |

- `index.js` maps to the parent directory path
- `[param]` in filenames becomes `:param` in the URL
- Nested folders create nested URL segments

## Base Class

`Route` from `zyket`

## Template

```js
const { Route } = require("zyket");

module.exports = class extends Route {
  // Optional: attach middlewares per HTTP method
  // middlewares = {
  //   get: [new SomeMiddleware()],
  //   post: [new SomeMiddleware()]
  // }

  async get({ container, request, response }) {
    return { data: "value" };
  }

  async post({ container, request, response }) {
    const body = request.body;
    return { status: 201, created: true };
  }

  // Also available: put, delete
}
```

## Method Signature

| Param | Type | Description |
|-------|------|-------------|
| `container` | `ContainerBuilder` | DI service container |
| `request` | `Request` | Express request object |
| `response` | `Response` | Express response object |

## Return Values

- Return an **object** — the framework wraps it with `{ success: true, ...returnValue }` and sends as JSON.
- Set a `status` key to change the HTTP status code (defaults to `200`).
- Return a `RedirectResponse` to redirect: `return new RedirectResponse("/target-url")`.
- Return a `Buffer` to send a file download.
