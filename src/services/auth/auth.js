const AuthService = require('./index.js');

const auth = new AuthService({
  get: (serviceName) => {
  }
});

module.exports = auth.auth;