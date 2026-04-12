const Service = require('../Service');
const { toNodeHandler } = require('better-auth/node');
const { betterAuth } = require("better-auth");
const { admin, bearer, organization } = require("better-auth/plugins");
const { Pool } = require("pg");
const path = require("path");

module.exports = class AuthService extends Service {
  #container;
  client;

  constructor(container) {
    super('AuthService');
    this.#container = container;
  }

  async boot() {
    if (!['postgresql', 'sqlite'].includes(process.env.DATABASE_DIALECT)) {
      throw new Error("AuthService only supports PostgreSQL and SQLite as database dialects");
    }
    this.#addAuthEnvVariables();
    this.client = this.auth;
    const express = this.#container.get('express');
    express.regiterRawAllRoutes("/api/auth/*splat", toNodeHandler(this.auth));
  }

  #addAuthEnvVariables() {
    const EnvManager = require('../../utils/EnvManager');
    const envPath = path.join(process.cwd(), '.env');
    
    const secretAdded = EnvManager.addEnvVariable(envPath, 'AUTH_SECRET', 'change-this-secret-in-production');
    if (secretAdded) {
      this.#container.get('logger').info('Added AUTH_SECRET to .env file');
    }

    const originsAdded = EnvManager.addEnvVariable(envPath, 'TRUSTED_ORIGINS', 'http://localhost:5173,http://localhost:3000');
    if (originsAdded) {
      this.#container.get('logger').info('Added TRUSTED_ORIGINS to .env file');
    }

    const betterAuthUrlAdded = EnvManager.addEnvVariable(envPath, 'BETTER_AUTH_URL', 'http://localhost:3000');
    if (betterAuthUrlAdded) {
      this.#container.get('logger').info('Added BETTER_AUTH_URL to .env file');
    }
  }

  #getDatabaseConnection() {
    const dialect = process.env.DATABASE_DIALECT;

    if (dialect === 'sqlite') {
      const Database = require('better-sqlite3');
      const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'database.sqlite');
      return new Database(dbPath);
    } else if (dialect === 'postgresql') {
      return new Pool({
        connectionString: process.env.DATABASE_URL || null,
      });
    }

    throw new Error(`Unsupported database dialect: ${dialect}`);
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

  get memberAdditionalFields() {
    return {};
  }

  get organizationAdditionalFields() {
    return {};
  }

  get hooks() {
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
      hooks: this.hooks,
      plugins: [
        admin(),
        bearer(),
        organization({
          schema: {
            organization: {
              additionalFields: this.organizationAdditionalFields
            },
            member: { 
              additionalFields: this.memberAdditionalFields
            }
          },
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
      database: this.#getDatabaseConnection(),
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
      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
      secret: process.env.AUTH_SECRET || 'your-secret-key-change-in-production',
      trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:6632']
    })
  }

  get client() {
    return this.client;
  }
}