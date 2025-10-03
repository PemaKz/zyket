const http = require('http')

module.exports = class HTTPServer {
  #server
  #port

  constructor ({ port }) {
    if (!port || typeof port !== 'number' || port < 1) {
      throw new Error('port must be a positive number')
    }

    this.#port = port
    this.#server = http.createServer()
  }

  start () {
    if (this.isStarted) {
      throw new Error('Server is already started. Review your code')
    }
    console.log(`HTTP Server listening on port ${this.#port}`)

    this.#server.listen(this.#port, () => {})
  }

  get server () {
    return this.#server
  }

  get isStarted () {
    return this.#server?.listening === true
  }
}