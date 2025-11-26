const { Route } = require('../../../services/express');

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
