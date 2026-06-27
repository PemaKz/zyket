const { Handler } = require('zyket');

// The connection handler enforces auth on connect: throwing here disconnects
// the socket (see the SocketIO service). Authenticated sockets join the room.
module.exports = class ConnectionHandler extends Handler {
  async handle({ container, socket }) {
    const session = await container.get('auth').getSession(socket.handshake.headers);

    if (!session || !session.user) {
      throw new Error('Unauthorized'); // disconnects the socket
    }

    socket.data.user = session.user;
    socket.data.session = session.session;
    socket.join('general');

    container.get('logger').info(`Chat: ${session.user.email} connected (${socket.id})`);
    socket.emit('welcome', {
      room: 'general',
      user: { id: session.user.id, name: session.user.name },
    });
  }
};
