module.exports = (s3, bucketName, logger, getFileStat) => async (req, res) => {
  try {
    const { fileName } = req.params;
    const stat = await getFileStat(s3, fileName);
    
    res.json({
      success: true,
      file: {
        name: fileName,
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        contentType: stat.metaData?.['content-type']
      }
    });
  } catch (error) {
    logger.error(`Error getting file info: ${error.message}`);
    res.status(404).json({ success: false, message: 'File not found' });
  }
};
