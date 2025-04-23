const validator = require('validator');

module.exports = async ({ container, socket, data }) => {
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
};