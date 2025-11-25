module.exports = (s3, bucketName, logger, normalizePath) => async (req, res) => {
  try {
    const { folderPath } = req.body;
    
    if (!folderPath) {
      return res.status(400).json({ success: false, message: 'Folder path is required' });
    }

    const normalizedPath = normalizePath(folderPath);
    const folderMarker = `${normalizedPath}/.folder`;
    
    // Create an empty marker file to represent the folder
    await s3.saveFile(bucketName, folderMarker, Buffer.from(''), 'text/plain');
    
    logger.info(`Created folder: ${normalizedPath}`);
    
    res.json({
      success: true,
      message: 'Folder created successfully',
      folderPath: normalizedPath
    });
  } catch (error) {
    logger.error(`Error creating folder: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
