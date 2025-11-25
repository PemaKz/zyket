module.exports = (s3, bucketName, logger, getFileStat) => async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // Get file info first
    const stat = await getFileStat(s3, fileName);
    
    // Set response headers
    res.setHeader('Content-Type', stat.metaData?.['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', stat.size);

    // Stream the file
    await new Promise((resolve, reject) => {
      s3.client.getObject(bucketName, fileName, (err, stream) => {
        if (err) return reject(err);
        stream.pipe(res);
        stream.on('end', resolve);
        stream.on('error', reject);
      });
    });

    logger.info(`Downloaded file: ${fileName}`);
  } catch (error) {
    logger.error(`Error downloading file: ${error.message}`);
    if (!res.headersSent) {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  }
};
