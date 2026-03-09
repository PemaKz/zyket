# Create a Zyket Route

Create a new HTTP route file in the Zyket project.

## Instructions

Given a route path or description from the user, create the appropriate file inside `src/routes/` following Zyket's file-based routing conventions.

### File location rules:
- `/users` → `src/routes/users.js`
- `/users/:id` → `src/routes/users/[id].js`
- `/users/:id/posts` → `src/routes/users/[id]/posts.js`
- `/` (root) → `src/routes/index.js`

### Template

```js
const { Route } = require("zyket");

module.exports = class $ClassName$Route extends Route {
  // Add middlewares if needed:
  // middlewares = {
  //   get: [new SomeMiddleware()],
  //   post: [new SomeMiddleware()],
  // };

  async get({ container, request }) {
    return {};
  }

  async post({ container, request }) {
    return { status: 201 };
  }
};
```

### Steps:
1. Determine the correct file path based on the route the user wants.
2. Identify which HTTP methods are needed (get, post, put, delete).
3. Implement each method based on the user's described functionality.
4. Add middlewares if the route needs authentication or validation.
5. Use `container.get("database")` to access models, `container.get("cache")` for caching, etc.
