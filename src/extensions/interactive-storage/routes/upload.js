module.exports = (s3, bucketName, logger, normalizePath) => async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const folder = req.body.folder || '';
    const folderPath = folder ? normalizePath(folder) + '/' : '';

    const uploadPromises = req.files.map(async (file) => {
      const fileName = `${folderPath}${Date.now()}-${file.originalname}`;
      await s3.saveFile(bucketName, fileName, file.buffer, file.mimetype);
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

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    logger.error(`Error uploading files: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
