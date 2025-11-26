const { Middleware } = require('../../../services/express');
const multer = require('multer');

module.exports = class MulterMiddleware extends Middleware {
  upload;

  constructor(maxFileSize = 100 * 1024 * 1024) {
    super();
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: maxFileSize
      }
    });
  }

  async handle({ container, request, response, next }) {
    const uploadMiddleware = this.upload.array('files');
    
    return new Promise((resolve, reject) => {
      uploadMiddleware(request, response, (err) => {
        if (err) {
          container.get('logger').error(`Multer error: ${err.message}`);
          return reject(err);
        }
        next();
        resolve();
      });
    });
  }
};
