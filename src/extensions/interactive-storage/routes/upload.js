const { Route } = require('../../../services/express');

module.exports = class UploadRoute extends Route {
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
    
    if (!request.files || request.files.length === 0) {
      return { success: false, message: 'No files uploaded', status: 400 };
    }

    const folder = request.body.folder || '';
    const folderPath = folder ? this.normalizePath(folder) + '/' : '';

    const uploadPromises = request.files.map(async (file) => {
      const fileName = `${folderPath}${Date.now()}-${file.originalname}`;
      await this.s3.saveFile(this.bucketName, fileName, file.buffer, file.mimetype);
      return {
        originalName: file.originalname,
        fileName: fileName,
        folder: folder,
        size: file.size,
        mimeType: file.mimetype
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    logger.info(`Uploaded ${uploadedFiles.length} file(s) to S3 dropbox`);

    return {
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    };
  }
};
