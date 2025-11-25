module.exports = (s3, bucketName, logger) => async (req, res) => {
  try {
    const { fileName, fileNames } = req.body;
    
    // Support both single file and multiple files
    const filesToDelete = fileNames || (fileName ? [fileName] : []);
    
    if (!Array.isArray(filesToDelete) || filesToDelete.length === 0) {
      return res.status(400).json({ success: false, message: 'fileName or fileNames array is required' });
    }

    const deletePromises = filesToDelete.map(file => 
      s3.removeFile(bucketName, file).catch(err => ({ error: err.message, fileName: file }))
    );

    const results = await Promise.all(deletePromises);
    const errors = results.filter(r => r && r.error);
    const successCount = results.length - errors.length;

    logger.info(`Deleted ${successCount} file(s) from S3 dropbox`);

    res.json({
      success: errors.length === 0,
      message: `Deleted ${successCount} of ${filesToDelete.length} file(s)`,
      deletedCount: successCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error(`Error deleting files: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
