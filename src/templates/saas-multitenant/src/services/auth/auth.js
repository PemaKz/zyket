// Your auth configuration for the better-auth CLI. The CLI does not scan
// src/services/, so point it here explicitly:
//   npx @better-auth/cli generate|migrate --config src/services/auth/auth.js
const AuthService = require('./index.js');

const auth = new AuthService({
  get: () => {},
});

module.exports = auth.auth;
