const { Route } = require('../../../services/express');

// Reject object keys that try to escape the bucket prefix or are malformed,
// before they reach the S3 client.
function isUnsafeKey(key) {
  if (typeof key !== 'string' || key.length === 0) return true;
  if (key.includes('\\') || key.startsWith('/')) return true;
  return key.split('/').some((segment) => segment === '..' || segment === '.');
}

module.exports = class InfoRoute extends Route {
  s3;
  bucketName;
  getFileStat;

  constructor(path, s3, bucketName, getFileStat) {
    super(path);
    this.s3 = s3;
    this.bucketName = bucketName;
    this.getFileStat = getFileStat;
  }

  async get({ container, request }) {
    const logger = container.get('logger');
    
    try {
      const { fileName } = request.params;

      if (isUnsafeKey(fileName)) {
        return { success: false, message: 'Invalid file name', status: 400 };
      }

      const stat = await this.getFileStat(this.s3, fileName);
      
      return {
        success: true,
        file: {
          name: fileName,
          size: stat.size,
          lastModified: stat.lastModified,
          etag: stat.etag,
          contentType: stat.metaData?.['content-type']
        }
      };
    } catch (error) {
      logger.error(`Error getting file info: ${error.message}`);
      return { success: false, message: 'File not found', status: 404 };
    }
  }
};
