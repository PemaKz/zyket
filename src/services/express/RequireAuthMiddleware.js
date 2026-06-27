const Middleware = require("./Middleware");
const { fromNodeHeaders } = require("better-auth/node");

/**
 * Blocks the request unless there is a valid better-auth session.
 * Optionally restricts access to a set of roles (admin plugin).
 *
 * On success it attaches `request.user` and `request.session`.
 *
 * Usage in a Route:
 *   middlewares = { get: [ new RequireAuthMiddleware() ] }
 *   middlewares = { post: [ new RequireAuthMiddleware(['admin']) ] }
 */
module.exports = class RequireAuthMiddleware extends Middleware {
  constructor(roles = []) {
    super();
    this.roles = Array.isArray(roles) ? roles : [roles].filter(Boolean);
  }

  async handle({ container, request, response, next }) {
    const auth = container.get('auth');
    if (!auth || !auth.client) {
      return response.status(500).json({ success: false, message: 'Auth service not available' });
    }

    const session = await auth.client.api.getSession({
      headers: fromNodeHeaders(request.headers)
    });

    if (!session || !session.user) {
      return response.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (this.roles.length > 0) {
      const userRoles = String(session.user.role || '').split(',').map((r) => r.trim());
      const allowed = this.roles.some((role) => userRoles.includes(role));
      if (!allowed) {
        return response.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    request.user = session.user;
    request.session = session.session;
    next();
  }
};
