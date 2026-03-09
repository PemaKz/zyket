# Zyket – Authentication (better-auth)

Zyket uses [better-auth](https://better-auth.com) for authentication. It only supports **PostgreSQL** as the database dialect.

## Requirements

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DATABASE_DIALECT=postgresql
CACHE_URL=redis://localhost:6379  # required for session secondary storage
```

## Creating an Auth Service

Create a custom service that extends `AuthService`:

```js
// src/services/auth.js
const { AuthService } = require("zyket");

module.exports = class MyAuth extends AuthService {
  // Add extra better-auth plugins
  get plugins() {
    return [];
  }

  // Add social providers (Google, GitHub, etc.)
  get socialProviders() {
    return {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    };
  }

  // Extra fields on the user table
  get userAdditionalFields() {
    return {
      role: {
        type: "string",
        defaultValue: "user",
        input: false, // cannot be set by user on sign-up
      },
    };
  }

  // Email hooks (implement or throw to disable)
  async sendResetPasswordEmail({ user, url, token }, request) {
    // Send email with the reset URL
  }

  async sendVerificationEmail({ user, url, token }, request) {
    // Send email with the verification URL
  }

  async sendInvitationEmail(data) {
    // Send org invitation email
  }

  async allowUserToCreateOrganization(user) {
    return user.role === "admin"; // only admins can create orgs
  }
};
```

## Registering the Auth Service

```js
// index.js
const { Kernel } = require("zyket");
const MyAuth = require("./src/services/auth");

const kernel = new Kernel({
  services: [
    ["auth", MyAuth, ["@service_container"]],
  ],
});

kernel.boot();
```

## Endpoints Provided

All better-auth REST endpoints are mounted at `/api/auth/*`. This includes:

- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `POST /api/auth/forget-password`
- `POST /api/auth/reset-password`
- `GET  /api/auth/session`
- `GET  /api/auth/verify-email`
- Social provider OAuth flows (`/api/auth/sign-in/:provider`)
- Admin routes (`/api/auth/admin/...`)
- Organization routes (`/api/auth/organization/...`)

## Verifying Sessions in Routes

Use the `auth` property on the service or use `better-auth/node` token utilities:

```js
// src/middlewares/auth.js
const { Middleware } = require("zyket");

module.exports = class AuthMiddleware extends Middleware {
  async handle({ container, request, response, next }) {
    const auth = container.get("auth").client;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return response.status(401).json({ success: false, message: "Unauthorized" });
    }
    request.user = session.user;
    next();
  }
};
```

## Built-in Plugins Included

The base `AuthService` always includes:
- `admin` – admin panel routes + `banUser`, `unbanUser`, `listUsers`, etc.
- `bearer` – Bearer token support (for API use)
- `organization` – multi-tenancy / organisations

## Cookie Configuration

Cookies are configured for cross-subdomain, `SameSite=none`, `Secure=true` by default (suitable for separate frontend/backend domains).
