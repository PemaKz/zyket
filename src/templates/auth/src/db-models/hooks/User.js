/* eslint-disable no-async-promise-executor */
const crypto = require('crypto')

module.exports = (User, container) => {
  User.beforeCreate(async (user, options) => {
    const salt = process.env.ENCRYPTION_SALT || ''
    user.password = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex')
  })

  /**
   * Verify if the password is valid
   * @param {string} password - The password to verify
   * @returns {Boolean} - Boolean
  */
  User.prototype.isValidPassword = async function (password) {
    const { User } = container.get('database').models
    const user = await User.findByPk(this.id, {
      attributes: ['password']
    })
    const hash = crypto.pbkdf2Sync(password, process.env.ENCRYPTION_SALT, 1000, 64, 'sha512').toString('hex')
    return user.password === hash
  }

  User.prototype.generateAuthToken = async function () {
    const token = crypto.randomBytes(32).toString('hex')
    const cache = container.get('cache')
    await cache.set(`auth:${token}`, JSON.stringify({
      ...this.toJSON()
    }))
    await cache.expire(`auth:${token}`, 60 * 60 * 24 * 7)
    return token
  }

  User.prototype.removeAuthToken = function (token) {
    return new Promise((resolve, reject) => {
      try {
        const cache = container.get('cache')
        cache.del(`auth:${token}`).then(() => {
          resolve()
        }).catch(err => reject(err))
      } catch (err) {
        reject(err)
      }
    })
  }
}
