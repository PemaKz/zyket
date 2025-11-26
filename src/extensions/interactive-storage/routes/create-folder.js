const { Route } = require('../../../services/express');

module.exports = class CreateFolderRoute extends Route {
  s3;
  bucketName;
  normalizePath;

  constructor(path, s3, bucketName, normalizePath) {
    super(path);
    this.s3 = s3;
    this.bucketName = bucketName;
    this.normalizePath = normalizePath;
  }

  async post({ container, request }) {
    const logger = container.get('logger');
    const { folderPath } = request.body;
    
    if (!folderPath) {
      return { success: false, message: 'Folder path is required', status: 400 };
    }

    const normalizedPath = this.normalizePath(folderPath);
    const folderMarker = `${normalizedPath}/.folder`;
    
    // Create an empty marker file to represent the folder
    await this.s3.saveFile(this.bucketName, folderMarker, Buffer.from(''), 'text/plain');
    
    logger.info(`Created folder: ${normalizedPath}`);
    
    return {
      success: true,
      message: 'Folder created successfully',
      folderPath: normalizedPath
    };
  }
};
