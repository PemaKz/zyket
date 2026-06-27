const { Middleware } = require('zyket');

/**
 * Requires an authenticated user that has an ACTIVE organization in the
 * current session. Run it AFTER RequireAuthMiddleware (which attaches
 * `request.session`). Attaches `request.organizationId`.
 */
module.exports = class RequireOrganization extends Middleware {
  async handle({ request, response, next }) {
    const activeOrganizationId = request.session?.activeOrganizationId;

    if (!activeOrganizationId) {
      return response.status(403).json({
        success: false,
        message: 'No active organization. Set one via POST /api/auth/organization/set-active',
      });
    }

    request.organizationId = activeOrganizationId;
    next();
  }
};
