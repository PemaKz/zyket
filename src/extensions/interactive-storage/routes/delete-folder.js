const { Route } = require('../../../services/express');

module.exports = class DeleteFolderRoute extends Route {
  s3;
  bucketName;
  normalizePath;
  listFiles;
  maxDeleteBatch;

  constructor(path, s3, bucketName, normalizePath, listFiles, maxDeleteBatch = 100) {
    super(path);
    this.s3 = s3;
    this.bucketName = bucketName;
    this.normalizePath = normalizePath;
    this.listFiles = listFiles;
    this.maxDeleteBatch = maxDeleteBatch;
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

    // Cap the batch size to avoid mass-deletion / resource-exhaustion when a
    // prefix contains a very large number of objects.
    if (files.length > this.maxDeleteBatch) {
      return {
        success: false,
        message: `Folder contains too many files (${files.length}). Maximum allowed per request is ${this.maxDeleteBatch}`,
        status: 400
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
