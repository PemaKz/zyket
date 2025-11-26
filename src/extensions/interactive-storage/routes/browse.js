const { Route } = require('../../../services/express');

module.exports = class BrowseRoute extends Route {
  s3;
  bucketName;
  normalizePath;
  listFilesAndFolders;

  constructor(path, s3, bucketName, normalizePath, listFilesAndFolders) {
    super(path);
    this.s3 = s3;
    this.bucketName = bucketName;
    this.normalizePath = normalizePath;
    this.listFilesAndFolders = listFilesAndFolders;
  }

  async get({ container, request }) {
    const logger = container.get('logger');
    const folder = request.query.folder || '';
    const prefix = folder ? this.normalizePath(folder) + '/' : '';
    
    const items = await this.listFilesAndFolders(this.s3, prefix);
    
    return {
      success: true,
      bucket: this.bucketName,
      currentPath: folder,
      items: items
    };
  }
};
