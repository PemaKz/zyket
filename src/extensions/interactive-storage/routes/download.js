const { Route } = require('../../../services/express');
const path = require('path');

// Reject object keys that try to escape the bucket prefix or are malformed,
// before they reach the S3 client.
function isUnsafeKey(key) {
  if (typeof key !== 'string' || key.length === 0) return true;
  if (key.includes('\\') || key.startsWith('/')) return true;
  return key.split('/').some((segment) => segment === '..' || segment === '.');
}

module.exports = class DownloadRoute extends Route {
  s3;
  bucketName;
  getFileStat;

  constructor(path, s3, bucketName, getFileStat) {
    super(path);
    this.s3 = s3;
    this.bucketName = bucketName;
    this.getFileStat = getFileStat;
  }

  async get({ container, request, response }) {
    const logger = container.get('logger');
    const { fileName } = request.params;

    if (isUnsafeKey(fileName)) {
      return { success: false, message: 'Invalid file name', status: 400 };
    }

    try {
      // Get file info first
      const stat = await this.getFileStat(this.s3, fileName);
      
      // Set response headers. Sanitize the filename to prevent header
      // injection (CRLF / quote breakout) from the user-controlled key.
      const baseName = path.posix.basename(fileName);
      const asciiName = baseName.replace(/[^\w.\- ]/g, '_') || 'download';
      response.setHeader('Content-Type', stat.metaData?.['content-type'] || 'application/octet-stream');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(baseName)}`
      );
      response.setHeader('Content-Length', stat.size);

      // Stream the file
      await new Promise((resolve, reject) => {
        this.s3.client.getObject(this.bucketName, fileName, (err, stream) => {
          if (err) return reject(err);
          stream.pipe(response);
          stream.on('end', resolve);
          stream.on('error', reject);
        });
      });

      logger.info(`Downloaded file: ${fileName}`);
      
      // Return null to indicate response was handled manually
      return null;
    } catch (error) {
      logger.error(`Error downloading file: ${error.message}`);
      return { success: false, message: 'File not found', status: 404 };
    }
  }
};
