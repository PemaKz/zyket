const validator = require('validator');

module.exports = async ({ container, socket, data }) => {
  const { email, password } = data;

  if(!email) return socket.emit('auth.register', { error: 'Email is required' });
  if(validator.isEmpty(email)) return socket.emit('auth.register', { error: 'Email is invalid' });
  if(!validator.isEmail(email)) return socket.emit('auth.register', { error: 'Email is invalid' });

  if(!password) return socket.emit('auth.register', { error: 'Password is required' });
  if(validator.isEmpty(password)) return socket.emit('auth.register', { error: 'Password is invalid' });
  if(!validator.isLength(password, { min: 6 })) return socket.emit('auth.register', { error: 'Password must be at least 6 characters' });

  const { User } = container.get('database').models;

  try {
    await User.create({ email, password })
  } catch (error) {
    return socket.emit('auth.register', { error: 'Email already exists' });
  }

  const user = await User.findOne({ where: { email } });

  socket.emit('auth.register', { user });
};