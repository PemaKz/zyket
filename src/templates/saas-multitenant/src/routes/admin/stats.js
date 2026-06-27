const { Route, RequireAdminMiddleware } = require('zyket');

// Global admin-only endpoint (better-auth admin plugin role === 'admin').
module.exports = class AdminStatsRoute extends Route {
  middlewares = {
    get: [new RequireAdminMiddleware()],
  };

  async get() {
    return {
      message: 'Admin-only data',
      // ...gather real stats here
    };
  }
};
