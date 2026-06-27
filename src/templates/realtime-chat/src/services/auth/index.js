const { AuthService } = require('zyket');

module.exports = class CustomAuthService extends AuthService {
  get organizationEnabled() {
    return false;
  }

  get requireEmailVerification() {
    return false;
  }

  async sendResetPasswordEmail({ user, url }) {
    console.log(`[auth] Reset password for ${user.email}: ${url}`);
  }

  async sendVerificationEmail({ user, url }) {
    console.log(`[auth] Verify email for ${user.email}: ${url}`);
  }
};
