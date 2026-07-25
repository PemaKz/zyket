const Service = require('../Service');
const { toNodeHandler } = require('better-auth/node');
const { betterAuth } = require("better-auth");
const { admin, bearer, organization } = require("better-auth/plugins");
const { Pool } = require("pg");
const path = require("path");
const crypto = require("crypto");

module.exports = class AuthService extends Service {
  #container;
  #authOptions;
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

  // Resolve the current better-auth session from raw Node request headers
  // (e.g. `request.headers` or `socket.handshake.headers`). Lets application
  // code check sessions without importing better-auth directly.
  async getSession(headers) {
    const { fromNodeHeaders } = require('better-auth/node');
    return this.client.api.getSession({ headers: fromNodeHeaders(headers) });
  }

  #addAuthEnvVariables() {
    const EnvManager = require('../../utils/EnvManager');
    const envPath = path.join(process.cwd(), '.env');
    
    // Generate a strong, unique secret per project instead of a static value.
    const generatedSecret = crypto.randomBytes(32).toString('hex');
    const secretAdded = EnvManager.addEnvVariable(envPath, 'AUTH_SECRET', generatedSecret);
    if (secretAdded) {
      // dotenv already loaded before this file was written, so make the freshly
      // generated value available for this first run too.
      process.env.AUTH_SECRET = generatedSecret;
      this.#container.get('logger').info('Generated a random AUTH_SECRET and added it to .env file');
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

  #requireAuthSecret() {
    const secret = process.env.AUTH_SECRET;
    // Fail closed: never fall back to a hard-coded/shared secret.
    if (!secret || secret === 'change-this-secret-in-production' || secret === 'your-secret-key-change-in-production') {
      throw new Error('AUTH_SECRET is missing or insecure. Set a strong, unique AUTH_SECRET in your .env file.');
    }
    return secret;
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

  get organizationEnabled() {
    return true;
  }

  get requireEmailVerification() {
    return false;
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

  // Run the better-auth migrations that are still pending: create missing
  // tables and add missing columns. Same work as
  // `npx @better-auth/cli migrate --config src/services/auth/auth.js`, but from
  // inside the app — so adding a plugin (two-factor, jwt, …) or a new
  // additional field only needs `await container.get('auth').migrate()`.
  //
  // Pass `{ dryRun: true }` to get the SQL back without touching the database.
  // Returns { pending, tablesCreated, fieldsAdded, sql } so callers can log,
  // assert, or refuse to boot on a dirty schema.
  async migrate({ dryRun = false } = {}) {
    if (!['postgresql', 'sqlite'].includes(process.env.DATABASE_DIALECT)) {
      throw new Error('AuthService.migrate() only supports PostgreSQL and SQLite as database dialects');
    }

    const logger = this.#logger();
    // ESM-only subpath; import() keeps this working regardless of Node's
    // require(esm) support.
    const { getMigrations } = await import('better-auth/db/migration');
    const { toBeCreated, toBeAdded, runMigrations, compileMigrations } = await getMigrations(this.authOptions);

    const tablesCreated = toBeCreated.map((table) => table.table);
    const fieldsAdded = toBeAdded.flatMap(
      (table) => Object.keys(table.fields).map((field) => `${table.table}.${field}`)
    );
    const pending = tablesCreated.length + fieldsAdded.length;

    if (pending === 0) {
      logger.info('Auth schema is up to date, nothing to migrate');
      return { pending: 0, tablesCreated: [], fieldsAdded: [], sql: dryRun ? '' : undefined };
    }

    const summary = [
      tablesCreated.length ? `tables: ${tablesCreated.join(', ')}` : null,
      fieldsAdded.length ? `fields: ${fieldsAdded.join(', ')}` : null,
    ].filter(Boolean).join(' | ');

    if (dryRun) {
      const sql = await compileMigrations();
      logger.info(`Auth migrations pending (dry run, nothing applied) — ${summary}`);
      return { pending, tablesCreated, fieldsAdded, sql };
    }

    await runMigrations();
    logger.info(`Auth migrations applied — ${summary}`);
    return { pending, tablesCreated, fieldsAdded };
  }

  // The logger is unavailable when the service is built outside a booted
  // kernel (e.g. the better-auth CLI loading src/services/auth/auth.js), and
  // the DI container throws on unknown services rather than returning null.
  #logger() {
    try {
      return this.#container?.get('logger') || console;
    } catch {
      return console;
    }
  }

  // Built once and reused: every access to `auth` would otherwise open another
  // SQLite handle / pg Pool. `migrate()` needs the very same options object,
  // since that is what defines the expected schema.
  get authOptions() {
    if (!this.#authOptions) this.#authOptions = this.#buildAuthOptions();
    return this.#authOptions;
  }

  get auth() {
    return betterAuth(this.authOptions);
  }

  #buildAuthOptions() {
    const cache = this.#container.get('cache');

    // Environment-aware cookie security:
    // - Cross-domain front/back (different sites): set AUTH_CROSS_DOMAIN=true ->
    //   sameSite "none" + secure + cross-subdomain (requires HTTPS).
    // - Otherwise (local dev, or same-site/same-domain prod): sameSite "lax" and
    //   secure only in production, so cookies work over http://localhost in dev.
    const crossDomain = process.env.AUTH_CROSS_DOMAIN === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieSameSite = crossDomain ? 'none' : 'lax';
    const cookieSecure = crossDomain || isProduction;

    return {
      hooks: this.hooks,
      plugins: [
        admin(),
        bearer(),
        ...(this.organizationEnabled ? [
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
            sendInvitationEmail: async (data) => {
              return await this.sendInvitationEmail(data);
            }
          })
        ] : []),
        ...this.plugins,
      ],
      socialProviders: this.socialProviders,
      database: this.#getDatabaseConnection(),
      advanced: {
        ...(crossDomain ? { crossSubDomainCookies: { enabled: true } } : {}),
        defaultCookieAttributes: {
          sameSite: cookieSameSite,
          secure: cookieSecure,
          httpOnly: true,
        },
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
        requireEmailVerification: this.requireEmailVerification,
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
      secret: this.#requireAuthSecret(),
      trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:6632']
    };
  }
}