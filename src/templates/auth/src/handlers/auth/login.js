const { Handler } = require("zyket");

module.exports = class LoginHandler extends Handler {
  middleware = [];
  
  async handle({ container, socket, data, io }) {
    const {email, password} = data
    const { User } = container.get('database').models
    const user = await User.findOne({ where: { email } })

    if(!user) return socket.emit("auth.login", { error: "User not found" })
    if(!await user.isValidPassword(password)) return socket.emit("auth.login", { error: "Invalid password" })

    const token = await user.generateAuthToken()

    socket.user = user
    socket.token = token

    socket.emit("auth.login", { ...user.toJSON(), token })
  }
};