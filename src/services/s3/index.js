const Service = require("../Service");
const MinioService = require('minio')

module.exports = class S3 extends Service {
  #container
  #endPoint
  #port
  #useSSL
  #accessKey
  #secretKey
  #publicBuckets
  #privateBuckets

  constructor(container, endPoint, port, useSSL, accessKey, secretKey, publicBuckets, privateBuckets) {
    super('s3')
    this.#container = container
    this.#endPoint = endPoint
    this.#port = port
    this.#useSSL = useSSL
    this.#accessKey = accessKey
    this.#secretKey = secretKey
    this.#publicBuckets = this.#parseBuckets(publicBuckets)
    this.#privateBuckets = this.#parseBuckets(privateBuckets)
  }

  async boot() {
    this.client = new MinioService.Client({
      endPoint: this.#endPoint,
      port: this.#port,
      useSSL: this.#useSSL,
      accessKey: this.#accessKey,
      secretKey: this.#secretKey
    })

    await this.initBuckets()
  }

  #parseBuckets(value) {
    if (!value) return []
    return value
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  }

  async initBuckets() {
    for (const bucketName of this.#privateBuckets) {
      await this.ensureBucket(bucketName, false)
    }
    for (const bucketName of this.#publicBuckets) {
      await this.ensureBucket(bucketName, true)
    }
  }

  async ensureBucket(bucketName, isPublic = false) {
    const exists = await this.client.bucketExists(bucketName)
    if (!exists) {
      this.#container.get('logger').info(`Creating ${isPublic ? 'public' : 'private'} bucket ${bucketName}`)
      await this.client.makeBucket(bucketName, 'us-east-1')
    }

    if (isPublic) {
      await this.setBucketPublic(bucketName)
    }
  }

  async setBucketPublic(bucketName) {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    }
    this.#container.get('logger').debug(`Setting public read policy on bucket ${bucketName}`)
    return this.client.setBucketPolicy(bucketName, JSON.stringify(policy))
  }

  async saveFile(bucketName, fileName, file, contentType = 'binary/octet-stream') {
    this.#container.get('logger').debug(`Saving file ${fileName} to bucket ${bucketName}`);
    return new Promise((resolve, reject) => {
      this.client.putObject(
        bucketName,
        fileName,
        file,
        {
          "Content-Type": contentType
        },
        (err, etag) => {
          if (err) return reject(err);
          resolve(etag);
        }
      );
    });
  }

  async getFile(bucketName, fileName) {
    return new Promise((resolve, reject) => {
      let data = ''
      this.client.getObject(bucketName, fileName, (err, stream) => {
        if(err) return reject(err)
        stream.on('data', (chunk) => {
          data += chunk
        })
        stream.on('end', () => {
          resolve(data)
        })
      })
    })
  }

  async removeFile(bucketName, fileName) {
    this.#container.get('logger').debug(`Removing file ${fileName} from bucket ${bucketName}`);
    return this.client.removeObject(bucketName, fileName)
  }

  async createBucket(bucketName) {
    this.#container.get('logger').debug(`Creating bucket ${bucketName}`);
    return this.client.makeBucket(bucketName, 'us-east-1')
  }

  listBuckets() {
    return new Promise((resolve, reject) => {
      this.client.listBuckets((err, buckets) => {
        if(err) return reject(err)
        resolve(buckets)
      })
    })
  }
}