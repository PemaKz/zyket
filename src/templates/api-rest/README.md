# api-rest template

Backend-only REST API starter with email/password auth and a protected CRUD
resource (`Task`). No frontend, no sockets.

## What's included
- `index.js` — boots the kernel (auth + database + express) and syncs the `Task` table.
- `src/services/auth/` — auth service (email/password, no organizations).
- `src/models/Task.js` — example Sequelize model.
- `src/routes/tasks/` — full CRUD, every endpoint protected with `RequireAuthMiddleware`.

## Endpoints (all require a valid session)
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/tasks`      | List tasks |
| POST   | `/tasks`      | Create a task `{ title, description? }` |
| GET    | `/tasks/:id`  | Get one task |
| PUT    | `/tasks/:id`  | Update a task |
| DELETE | `/tasks/:id`  | Delete a task |

Auth endpoints are mounted by better-auth under `/api/auth/*`.

## Setup
```bash
npm install
# 1) Create the better-auth tables (uses src/services/auth/auth.js)
npx @better-auth/cli migrate
# 2) Run
node index.js
```

The `Task` table is created automatically via `sequelize.sync()` on boot.

## Auth quick test
```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"supersecret","name":"Me"}' -c cookies.txt

# Create a task with the session cookie
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"title":"My first task"}'
```

## Notes
- `RequireAuthMiddleware` attaches `request.user` / `request.session`. Restrict by role with `new RequireAuthMiddleware(['admin'])`.
- Email sending is stubbed (logged to console) — wire a real provider in `src/services/auth/index.js`.
- Review [SECURITY.md] in the framework for hardening (Swagger password, CORS, rate limiting).
