const Guard = require("./Guard");
const { fromNodeHeaders } = require("better-auth/node");

/**
 * Socket.IO guard that rejects the connection/event unless there is a valid
 * better-auth session in the handshake. Throwing here blocks the event
 * (see SocketIO service guard handling).
 *
 * On success it attaches the user to `socket.data.user`.
 *
 * Usage: create `src/guards/auth.js` with:
 *   module.exports = require('zyket').AuthGuard;
 * and reference it from a handler: `guards = ["auth"];`
 */
module.exports = class AuthGuard extends Guard {
  async handle({ container, socket }) {
    const auth = container.get('auth');
    if (!auth || !auth.client) {
      throw new Error('Auth service not available');
    }

    const session = await auth.client.api.getSession({
      headers: fromNodeHeaders(socket.handshake.headers)
    });

    if (!session || !session.user) {
      throw new Error('Unauthorized');
    }

    socket.data.user = session.user;
    socket.data.session = session.session;
  }
};
