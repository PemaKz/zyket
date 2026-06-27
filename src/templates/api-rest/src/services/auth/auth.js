// Used by the better-auth CLI (`npx @better-auth/cli generate|migrate`) to
// discover your auth configuration.
const AuthService = require('./index.js');

const auth = new AuthService({
  get: () => {},
});

module.exports = auth.auth;
