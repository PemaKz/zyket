const { Handler } = require("zyket");

module.exports = class LogoutHandler extends Handler {
  middleware = [];
  
  async handle({ container, socket, data, io }) {
    if(!socket.user) return socket.emit('auth.logout', { error: 'Not authenticated' });
    const { token } = socket;
    if (!token) return socket.emit('auth.logout', { error: 'Not authenticated' });

    const cache = container.get('cache');
    const tokenData = await cache.get(`auth:${token}`);
    if (!tokenData) return socket.emit('auth.logout', { error: 'Not authenticated' });

    try {
      await cache.del(`auth:${token}`);
      socket.emit('auth.logout', { success: true });
    } catch (error) {
      socket.emit('auth.logout', { error: error.message });
    }
  }
};