const Extension = require('../Extension');
const multer = require('multer');

// Import route handlers
const uploadHandler = require('./routes/upload');
const browseHandler = require('./routes/browse');
const downloadHandler = require('./routes/download');
const infoHandler = require('./routes/info');
const deleteHandler = require('./routes/delete');
const createFolderHandler = require('./routes/create-folder');
const deleteFolderHandler = require('./routes/delete-folder');

module.exports = class InteractiveStorageExtension extends Extension {
  path;
  bucketName;
  maxFileSize;
  middlewares;

  constructor({ path = '/storage', bucketName = 'dropbox', maxFileSize = 100 * 1024 * 1024, middlewares = [] } = {}) {
    super("InteractiveStorageExtension");
    this.path = path || '/storage';
    this.bucketName = bucketName;
    this.maxFileSize = maxFileSize; // Default 100MB
    this.middlewares = middlewares || [];
  }

  load(container) {
    if (!container.get('s3')) return container.get('logger').warn('InteractiveStorageExtension: s3 service not found, skipping InteractiveStorage setup');
    if (!container.get('express')) return container.get('logger').warn('InteractiveStorageExtension: express service not found, skipping InteractiveStorage setup');

    const app = container.get('express').app();
    const s3 = container.get('s3');
    const logger = container.get('logger');

    // Ensure bucket exists
    this.#ensureBucket(s3, logger);

    // Configure multer for file uploads (memory storage)
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: this.maxFileSize
      }
    });

    // Bind helper methods
    const normalizePath = this.#normalizePath.bind(this);
    const listFiles = this.#listFiles.bind(this);
    const listFilesAndFolders = this.#listFilesAndFolders.bind(this);
    const getFileStat = this.#getFileStat.bind(this);

    // Register routes
    app.post(`${this.path}/upload`, upload.array('files'), uploadHandler(s3, this.bucketName, logger, normalizePath));
    app.get(`${this.path}/browse`, browseHandler(s3, this.bucketName, logger, normalizePath, listFilesAndFolders));
    app.get(`${this.path}/download/:fileName`, downloadHandler(s3, this.bucketName, logger, getFileStat));
    app.get(`${this.path}/info/:fileName`, infoHandler(s3, this.bucketName, logger, getFileStat));
    app.delete(`${this.path}/delete`, deleteHandler(s3, this.bucketName, logger));
    app.post(`${this.path}/create-folder`, createFolderHandler(s3, this.bucketName, logger, normalizePath));
    app.delete(`${this.path}/delete-folder`, deleteFolderHandler(s3, this.bucketName, logger, normalizePath, listFiles));

    logger.info(`InteractiveStorage extension loaded at ${this.path}`);
  }

  async #ensureBucket(s3, logger) {
    try {
      const buckets = await s3.listBuckets();
      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        await s3.createBucket(this.bucketName);
        logger.info(`Created S3 bucket: ${this.bucketName}`);
      }
    } catch (error) {
      logger.error(`Error ensuring bucket exists: ${error.message}`);
    }
  }

  async #listFiles(s3, prefix = '') {
    return new Promise((resolve, reject) => {
      const files = [];
      const stream = s3.client.listObjectsV2(this.bucketName, prefix, true);
      
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
      
      const stream = s3.client.listObjectsV2(this.bucketName, prefix, false);
      
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
      s3.client.statObject(this.bucketName, fileName, (err, stat) => {
        if (err) return reject(err);
        resolve(stat);
      });
    });
  }
}