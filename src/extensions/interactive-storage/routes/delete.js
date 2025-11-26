const { Route } = require('../../../services/express');

module.exports = class DeleteRoute extends Route {
  s3;
  bucketName;

  constructor(path, s3, bucketName) {
    super(path);
    this.s3 = s3;
    this.bucketName = bucketName;
  }

  async delete({ container, request }) {
    const logger = container.get('logger');
    const { fileName, fileNames } = request.body;
    
    // Support both single file and multiple files
    const filesToDelete = fileNames || (fileName ? [fileName] : []);
    
    if (!Array.isArray(filesToDelete) || filesToDelete.length === 0) {
      return { success: false, message: 'fileName or fileNames array is required', status: 400 };
    }

    const deletePromises = filesToDelete.map(file => 
      this.s3.removeFile(this.bucketName, file).catch(err => ({ error: err.message, fileName: file }))
    );

    const results = await Promise.all(deletePromises);
    const errors = results.filter(r => r && r.error);
    const successCount = results.length - errors.length;

    logger.info(`Deleted ${successCount} file(s) from S3 dropbox`);

    return {
      success: errors.length === 0,
      message: `Deleted ${successCount} of ${filesToDelete.length} file(s)`,
      deletedCount: successCount,
      errors: errors.length > 0 ? errors : undefined
    };
  }
};
