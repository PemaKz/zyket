const RequireAuthMiddleware = require("./RequireAuthMiddleware");

/**
 * Convenience middleware that requires an authenticated user with the
 * `admin` role (better-auth admin plugin).
 *
 * Usage in a Route:
 *   middlewares = { delete: [ new RequireAdminMiddleware() ] }
 */
module.exports = class RequireAdminMiddleware extends RequireAuthMiddleware {
  constructor(adminRole = 'admin') {
    super([adminRole]);
  }
};
