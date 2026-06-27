const { Handler } = require('zyket');

// Handles `socket.emit("message", { text })`. The `auth` guard re-validates the
// session before every message (defense in depth) and re-attaches the user.
module.exports = class MessageHandler extends Handler {
  guards = ['auth'];

  async handle({ container, socket, data, io }) {
    const user = socket.data.user;
    const text = String(data?.text || '').trim().slice(0, 2000);

    if (!text) {
      return { error: 'Empty message' };
    }

    const message = {
      id: `${Date.now()}-${socket.id}`,
      text,
      user: { id: user.id, name: user.name },
      at: new Date().toISOString(),
    };

    // Broadcast to everyone in the room (including sender).
    io.to('general').emit('message', message);

    container.get('logger').debug(`Chat message from ${user.email}`);
    return { ok: true, message };
  }
};
