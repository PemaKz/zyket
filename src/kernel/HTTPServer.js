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

    // The socket accepts connections from this point on, but Express only
    // attaches its request listener once its service boots. Without a
    // placeholder, anything arriving in between (health checks, an eager
    // client) would be accepted and then never answered — the request hangs
    // forever and the socket leaks. Answer 503 until Express takes over; it
    // replaces this listener when it boots. With DISABLE_EXPRESS=true the
    // placeholder stays, which is also the honest answer.
    this.#server.on('request', (request, response) => {
      response.writeHead(503, { 'Content-Type': 'application/json', 'Retry-After': '1' })
      response.end(JSON.stringify({ success: false, message: 'Server is starting' }))
    })

    this.#server.listen(this.#port, () => {})
  }

  get server () {
    return this.#server
  }

  get isStarted () {
    return this.#server?.listening === true
  }
}