module.exports = class RedirectResponse {
  url;

  constructor (url) {
    if (!url) throw new Error('url is required')

    this.url = url
  }
}