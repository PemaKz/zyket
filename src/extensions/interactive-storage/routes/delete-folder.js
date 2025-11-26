const { Route } = require('../../../services/express');

module.exports = class DeleteFolderRoute extends Route {
  s3;
  bucketName;
  normalizePath;
  listFiles;

  constructor(path, s3, bucketName, normalizePath, listFiles) {
    super(path);
    this.s3 = s3;
    this.bucketName = bucketName;
    this.normalizePath = normalizePath;
    this.listFiles = listFiles;
  }

  async delete({ container, request }) {
    const logger = container.get('logger');
    const { folderPath } = request.body;
    
    if (!folderPath) {
      return { success: false, message: 'Folder path is required', status: 400 };
    }

    const normalizedPath = this.normalizePath(folderPath);
    const prefix = `${normalizedPath}/`;
    
    // List all files in the folder
    const files = await this.listFiles(this.s3, prefix);
    
    if (files.length === 0) {
      return {
        success: true,
        message: 'Folder is empty or does not exist',
        deletedCount: 0
      };
    }

    // Delete all files
    const deletePromises = files.map(file => 
      this.s3.removeFile(this.bucketName, file.name).catch(err => ({ error: err.message, fileName: file.name }))
    );

    const results = await Promise.all(deletePromises);
    const errors = results.filter(r => r && r.error);
    const successCount = results.length - errors.length;

    logger.info(`Deleted folder ${normalizedPath} with ${successCount} files`);

    return {
      success: errors.length === 0,
      message: `Deleted folder and ${successCount} files`,
      deletedCount: successCount,
      errors: errors.length > 0 ? errors : undefined
    };
  }
};
