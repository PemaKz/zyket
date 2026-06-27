const { AuthService } = require('zyket');

module.exports = class CustomAuthService extends AuthService {
  // Multi-tenancy is the whole point of this template.
  get organizationEnabled() {
    return true;
  }

  get requireEmailVerification() {
    return false;
  }

  get organizationAdditionalFields() {
    return {
      // Example custom field on the organization:
      // plan: { type: 'string', required: false, defaultValue: 'free' },
    };
  }

  get memberAdditionalFields() {
    return {};
  }

  // Decide who is allowed to create new organizations.
  async allowUserToCreateOrganization(/* user */) {
    return true;
  }

  async sendInvitationEmail(data) {
    // TODO: send a real email with the invite link.
    // `data` contains { id, email, organization, inviter, role, ... }
    const acceptUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/accept-invitation/${data.id}`;
    console.log(`[auth] Invite ${data.email} to "${data.organization?.name}" -> ${acceptUrl}`);
  }

  async sendResetPasswordEmail({ user, url }) {
    console.log(`[auth] Reset password for ${user.email}: ${url}`);
  }

  async sendVerificationEmail({ user, url }) {
    console.log(`[auth] Verify email for ${user.email}: ${url}`);
  }
};
