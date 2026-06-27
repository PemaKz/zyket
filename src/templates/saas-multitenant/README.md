# saas-multitenant template

Multi-tenant SaaS starter built on better-auth's **organization** plugin
(organizations, members, roles, invitations) plus the **admin** plugin.

User/session/organization endpoints are all provided by better-auth — this
template focuses on the **config and the reusable gates** you need for your own
routes, not on re-implementing what better-auth already exposes.

## What's included
- `src/services/auth/` — auth service with organizations enabled, invitation email hook, and `allowUserToCreateOrganization`.
- `src/middlewares/RequireOrganization.js` — reusable gate that requires an active organization in the session.
- `src/models/Project.js` + `src/routes/projects` — a **tenant-scoped** resource: data isolated by organization (the core multi-tenant pattern).
- `src/routes/admin/stats` — minimal example of protecting a route with `RequireAdminMiddleware`.
- `frontend/` — React + Vite dashboard: sign in, create/switch organizations, and manage tenant-scoped projects.

## Org & auth endpoints (provided by better-auth, under `/api/auth`)
| Action | Endpoint |
|--------|----------|
| Sign up / in | `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email` |
| Create organization | `POST /api/auth/organization/create` |
| Set active organization | `POST /api/auth/organization/set-active` |
| Invite member | `POST /api/auth/organization/invite-member` |
| Accept invitation | `POST /api/auth/organization/accept-invitation` |

## Setup
```bash
npm install
npx @better-auth/cli migrate   # creates user/session/organization/member tables
node index.js
```
This starts the API on `:3000` and the Vite dashboard on `:5173`. Open
http://localhost:5173, sign up, create an organization, set it active, and add
projects (scoped to that organization).

### Cookies & local dev
Cookie security is environment-aware (framework auth service): local dev uses
`sameSite=lax` (works over `http://localhost`, frontend `:5173` + API `:3000` are
same-site). For cross-domain production set `AUTH_CROSS_DOMAIN=true` (needs HTTPS).

## Typical flow
1. `POST /api/auth/sign-up/email` → creates a user (session cookie returned).
2. `POST /api/auth/organization/create` `{ "name": "Acme", "slug": "acme" }`.
3. `POST /api/auth/organization/set-active` `{ "organizationId": "..." }`.
4. `GET /api/auth/get-session` → confirms the user and `activeOrganizationId`.
5. Invite teammates with `POST /api/auth/organization/invite-member` (the invite link is logged by `sendInvitationEmail`).

## Tenant-scoped routes (see `src/routes/projects`)
Compose the framework's `RequireAuthMiddleware` with this template's
`RequireOrganization` gate. After both run, `request.organizationId` is set and
every query is isolated to the active organization:

```bash
# with an active organization set on the session
curl -X POST http://localhost:3000/projects -b cookies.txt \
  -H "Content-Type: application/json" -d '{"name":"Website redesign"}'

curl http://localhost:3000/projects -b cookies.txt   # only this org's projects
```

That isolation by `organizationId` — not the auth endpoints — is what better-auth
leaves to you; this route is the pattern to copy for your own resources.

## Roles
- Global roles (admin plugin): `user.role` — used by `RequireAdminMiddleware`. Promote with `POST /api/auth/admin/set-role`.
- Organization roles (owner/admin/member): stored per membership. Check them in your own middleware by querying the member record for `request.organizationId`.

## Notes
- Configure organization custom fields in `organizationAdditionalFields` (e.g. a `plan`).
- Wire a real email provider in `sendInvitationEmail` / `sendVerificationEmail`.
- See the framework `SECURITY.md` before going to production (CSRF/cookies/CORS).
