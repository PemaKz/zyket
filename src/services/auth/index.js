const Service = require('../Service');
const { toNodeHandler } = require('better-auth/node');
const { betterAuth } = require("better-auth");
const { admin, bearer, organization } = require("better-auth/plugins");
const { Pool } = require("pg");

module.exports = class AuthService extends Service {
  #container;
  client;

  constructor(container) {
    super('AuthService');
    this.#container = container;
  }

  async boot() {
    if(process.env.DATABASE_DIALECT !== 'postgresql') throw new Error("AuthService only supports PostgreSQL as database dialect");
    this.client = this.auth;
    const express = this.#container.get('express');
    express.regiterRawAllRoutes("/api/*splat", toNodeHandler(this.auth));
  }

  get plugins() {
    return [];
  }

  get socialProviders() {
    return {}
  }

  get userAdditionalFields() {
    return {};
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

  get auth() {
    const cache = this.#container.get('cache');
    return betterAuth({
      plugins: [
        admin(),
        bearer(),
        organization({
          allowUserToCreateOrganization: async (user) => {
            return await this.allowUserToCreateOrganization(user);
          },
          async sendInvitationEmail(data) {
            return await this.sendInvitationEmail(data);
          }
        }),
        ...this.plugins,
      ],
      socialProviders: this.socialProviders,
      database: new Pool({
        connectionString: process.env.DATABASE_URL || null,
      }),
      advanced: {
        crossSubDomainCookies: {
          enabled: true,
        },
        cookie: {
          sameSite: "none",
          secure: true,
          path: "/",
          state: {
            attributes: {
              sameSite: "none",
              secure: true,
            }
          }
        },
        defaultCookieAttributes: {
          secure: true,
          sameSite: "none",
        },
        cookies: {
          state: {
            attributes: {
              sameSite: "none",
              secure: true,
            }
          }
        }
      },
      secondaryStorage: {
        get: async (key) => {
          return await cache.get(key);
        },
        set: async (key, value, ttl) => {
          await cache.set(key, value);
          if(ttl) await cache.expire(key, ttl);
        },
        delete: async (key) => {
          await cache.del(key);
        }
      },
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        sendResetPassword: async ({ user, url, token }, request) => this.sendResetPasswordEmail({ user, url, token }, request),
      },
      emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => this.sendVerificationEmail({ user, url, token }, request),
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
      },
      user: {
        additionalFields: this.userAdditionalFields
      },
      account: {
        accountLinking: { enabled: true },
        skipStateCookieCheck: true,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24
      },
      secret: process.env.AUTH_SECRET || 'your-secret-key-change-in-production',
      trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:6632']
    })
  }

  get client() {
    return this.client;
  }
}