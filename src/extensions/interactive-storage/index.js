const Extension = require('../Extension');

// Import route classes
const UploadRoute = require('./routes/upload');
const BrowseRoute = require('./routes/browse');
const DownloadRoute = require('./routes/download');
const InfoRoute = require('./routes/info');
const DeleteRoute = require('./routes/delete');
const CreateFolderRoute = require('./routes/create-folder');
const DeleteFolderRoute = require('./routes/delete-folder');
const MulterMiddleware = require('./middlewares/MulterMiddleware');

module.exports = class InteractiveStorageExtension extends Extension {
  static bucketName;
  path;
  maxFileSize;
  middlewares;

  constructor({ path = '/storage', bucketName = 'dropbox', maxFileSize = 100 * 1024 * 1024, middlewares = [] } = {}) {
    super("InteractiveStorageExtension");
    this.path = path || '/storage';
    InteractiveStorageExtension.bucketName = bucketName;
    this.maxFileSize = maxFileSize;
    this.middlewares = middlewares || [];
  }

  load(container) {
    if (!container.get('s3')) return container.get('logger').warn('InteractiveStorageExtension: s3 service not found, skipping InteractiveStorage setup');
    if (!container.get('express')) return container.get('logger').warn('InteractiveStorageExtension: express service not found, skipping InteractiveStorage setup');

    const express = container.get('express');
    const s3 = container.get('s3');
    const logger = container.get('logger');

    // Ensure bucket exists
    this.#ensureBucket(s3, logger);

    // Bind helper methods
    const normalizePath = this.#normalizePath.bind(this);
    const listFiles = this.#listFiles.bind(this);
    const listFilesAndFolders = this.#listFilesAndFolders.bind(this);
    const getFileStat = this.#getFileStat.bind(this);

    // Create route instances
    const routes = [
      new UploadRoute(`${this.path}/upload`, s3, InteractiveStorageExtension.bucketName, normalizePath),
      new BrowseRoute(`${this.path}/browse`, s3, InteractiveStorageExtension.bucketName, normalizePath, listFilesAndFolders),
      new DownloadRoute(`${this.path}/download/:fileName`, s3, InteractiveStorageExtension.bucketName, getFileStat),
      new InfoRoute(`${this.path}/info/:fileName`, s3, InteractiveStorageExtension.bucketName, getFileStat),
      new DeleteRoute(`${this.path}/delete`, s3, InteractiveStorageExtension.bucketName),
      new CreateFolderRoute(`${this.path}/create-folder`, s3, InteractiveStorageExtension.bucketName, normalizePath),
      new DeleteFolderRoute(`${this.path}/delete-folder`, s3, InteractiveStorageExtension.bucketName, normalizePath, listFiles)
    ];

    // Add multer middleware to upload route
    routes[0].middlewares = {
      post: [new MulterMiddleware(this.maxFileSize)]
    };

    // Register routes using the express service pattern
    express.registerRoutes(routes);

    logger.info(`InteractiveStorage extension loaded at ${this.path}`);
  }

  async #ensureBucket(s3, logger) {
    try {
      const buckets = await s3.listBuckets();
      const bucketExists = buckets.some(bucket => bucket.name === InteractiveStorageExtension.bucketName);
      
      if (!bucketExists) {
        await s3.createBucket(InteractiveStorageExtension.bucketName);
        logger.info(`Created S3 bucket: ${InteractiveStorageExtension.bucketName}`);
      }
    } catch (error) {
      logger.error(`Error ensuring bucket exists: ${error.message}`);
    }
  }

  async #listFiles(s3, prefix = '') {
    return new Promise((resolve, reject) => {
      const files = [];
      const stream = s3.client.listObjectsV2(InteractiveStorageExtension.bucketName, prefix, true);
      
      stream.on('data', (obj) => {
        files.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
          etag: obj.etag
        });
      });
      
      stream.on('end', () => resolve(files));
      stream.on('error', reject);
    });
  }

  async #listFilesAndFolders(s3, prefix = '') {
    return new Promise((resolve, reject) => {
      const items = [];
      const folders = new Set();
      
      const stream = s3.client.listObjectsV2(InteractiveStorageExtension.bucketName, prefix, false);
      
      stream.on('data', (obj) => {
        if (obj.prefix) {
          // This is a folder
          const folderName = obj.prefix.slice(prefix.length).replace(/\/$/, '');
          if (folderName && !folderName.includes('/')) {
            folders.add(folderName);
          }
        } else if (obj.name) {
          // This is a file
          const fileName = obj.name.slice(prefix.length);
          
          // Skip folder markers and files in subfolders
          if (fileName === '.folder' || fileName.includes('/')) {
            return;
          }
          
          items.push({
            type: 'file',
            name: fileName,
            fullPath: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
            etag: obj.etag
          });
        }
      });
      
      stream.on('end', () => {
        // Add folders to items
        folders.forEach(folder => {
          items.unshift({
            type: 'folder',
            name: folder,
            fullPath: prefix + folder
          });
        });
        
        resolve(items);
      });
      
      stream.on('error', reject);
    });
  }

  #normalizePath(path) {
    // Remove leading/trailing slashes and normalize
    return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
  }

  async #getFileStat(s3, fileName) {
    return new Promise((resolve, reject) => {
      s3.client.statObject(InteractiveStorageExtension.bucketName, fileName, (err, stat) => {
        if (err) return reject(err);
        resolve(stat);
      });
    });
  }
}