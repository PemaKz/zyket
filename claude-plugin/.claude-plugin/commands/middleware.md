# Create a Zyket Middleware

Create a new Express middleware file in the Zyket project.

## Instructions

Create a middleware class inside `src/middlewares/`. Middlewares must extend `Middleware` from `zyket` and implement the `handle` method.

### Template

```js
const { Middleware } = require("zyket");

module.exports = class $ClassName$Middleware extends Middleware {
  async handle({ container, request, response, next }) {
    // Your logic here
    // Call next() to allow the request to continue
    // Or return response.status(401).json({ success: false, message: "..." }) to block
    next();
  }
};
```

### Steps:
1. Create `src/middlewares/$name$.js` where `$name$` describes the purpose.
2. Implement the validation/authentication/transformation logic.
3. Call `next()` to pass the request through, or send a response to block.
4. Show the user how to attach it to a route.
