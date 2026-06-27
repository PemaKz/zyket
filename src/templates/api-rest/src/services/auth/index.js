const { AuthService } = require('zyket');

module.exports = class CustomAuthService extends AuthService {
  // This API does not use organizations/multi-tenancy.
  get organizationEnabled() {
    return false;
  }

  // Set to true once you wire a real email provider below.
  get requireEmailVerification() {
    return false;
  }

  async sendResetPasswordEmail({ user, url }) {
    // TODO: integrate your email provider. Logged for local development.
    this.client && console.log(`[auth] Reset password for ${user.email}: ${url}`);
  }

  async sendVerificationEmail({ user, url }) {
    // TODO: integrate your email provider. Logged for local development.
    console.log(`[auth] Verify email for ${user.email}: ${url}`);
  }
};
