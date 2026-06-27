# realtime-chat template

Authenticated real-time chat over Socket.IO. Sessions come from better-auth
(cookie sent during the websocket handshake), so only logged-in users can
connect or send messages.

## What's included
- `src/services/auth/` — email/password auth service.
- `src/guards/auth.js` — reuses the framework `AuthGuard` (session check per event).
- `src/handlers/connection.js` — enforces auth on connect, joins the `general` room.
- `src/handlers/message.js` — broadcasts `message` events to the room (guarded by `auth`).
- `frontend/` — React + Vite chat UI (login/register + live chat over Socket.IO).

## Setup
```bash
npm install
npx @better-auth/cli migrate
node index.js
```
This starts the API + websocket server on `:3000` and the Vite frontend on `:5173`.
Open http://localhost:5173, register a user, and start chatting (open two
browsers/users to see real-time delivery).

## How auth works here
1. The frontend signs in via better-auth → receives the session cookie.
2. The Socket.IO client connects with `withCredentials: true`; the cookie travels in the handshake.
3. `connection.js` validates the session and disconnects unauthenticated sockets.

## Cookies & local dev
Cookie security is now environment-aware (see the framework auth service):
- **Local dev** (default): `sameSite=lax`, not `secure` → works over `http://localhost`
  because the Vite frontend (`:5173`) and API (`:3000`) are same-site.
- **Cross-domain** front/back in production: set `AUTH_CROSS_DOMAIN=true` (requires HTTPS)
  to switch to `sameSite=none; secure`.

## Notes
- Set `REDIS_URL` to broadcast across multiple instances.
- `VITE_API_BASE` (frontend `.env`) points the UI at the backend; defaults to `http://localhost:3000`.
