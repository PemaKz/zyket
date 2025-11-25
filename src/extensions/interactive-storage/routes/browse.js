module.exports = (s3, bucketName, logger, normalizePath, listFilesAndFolders) => async (req, res) => {
  try {
    const folder = req.query.folder || '';
    const prefix = folder ? normalizePath(folder) + '/' : '';
    
    const items = await listFilesAndFolders(s3, prefix);
    
    res.json({
      success: true,
      bucket: bucketName,
      currentPath: folder,
      items: items
    });
  } catch (error) {
    logger.error(`Error browsing files: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
