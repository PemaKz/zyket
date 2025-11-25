module.exports = (s3, bucketName, logger, normalizePath, listFiles) => async (req, res) => {
  try {
    const { folderPath } = req.body;
    
    if (!folderPath) {
      return res.status(400).json({ success: false, message: 'Folder path is required' });
    }

    const normalizedPath = normalizePath(folderPath);
    const prefix = `${normalizedPath}/`;
    
    // List all files in the folder
    const files = await listFiles(s3, prefix);
    
    if (files.length === 0) {
      return res.json({
        success: true,
        message: 'Folder is empty or does not exist',
        deletedCount: 0
      });
    }

    // Delete all files
    const deletePromises = files.map(file => 
      s3.removeFile(bucketName, file.name).catch(err => ({ error: err.message, fileName: file.name }))
    );

    const results = await Promise.all(deletePromises);
    const errors = results.filter(r => r && r.error);
    const successCount = results.length - errors.length;

    logger.info(`Deleted folder ${normalizedPath} with ${successCount} files`);

    res.json({
      success: errors.length === 0,
      message: `Deleted folder and ${successCount} files`,
      deletedCount: successCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error(`Error deleting folder: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
