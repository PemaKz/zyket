const { AuthService } = require('zyket');

module.exports = class CustomAuthService extends AuthService {
  #container;
  client;

  constructor(container) {
    super(container);
    this.#container = container;
  }

  get userAdditionalFields() {
  }

  get organizationAdditionalFields() {
  }

  async sendResetPasswordEmail({ user, url, token }, request) {
    throw new Error("sendResetPasswordEmail method not implemented");
  }

  async sendVerificationEmail({ user, url, token }, request) {
    throw new Error("sendVerificationEmail method not implemented");
  }

  async sendInvitationEmail(data) {
    throw new Error("sendInvitationEmail method not implemented");
  }

  async allowUserToCreateOrganization(user) {
    throw new Error("allowUserToCreateOrganization method not implemented");
  }
}