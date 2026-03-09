# Zyket – Built-in Services & Custom Services

## Logger

Always available. Uses Winston under the hood.

```js
const logger = container.get("logger");

logger.info("Server started");
logger.debug("Debug info");
logger.warn("Something unexpected");
logger.error("An error occurred");
```

Logs are written to the directory configured by `LOG_DIRECTORY` (default: `./logs`).  
Enable debug logging with `DEBUG=true`.

## Cache (Redis)

Activated when `CACHE_URL` is set.

```js
const cache = container.get("cache");

await cache.set("key", "value");
const value = await cache.get("key");
await cache.del("key");
await cache.expire("key", 3600); // seconds
const keys = await cache.keys("prefix:*");
```

## S3 / MinIO

Activated when `S3_ENDPOINT`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` are set.

```env
S3_ENDPOINT=play.min.io
S3_PORT=443
S3_USE_SSL=true
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
```

```js
const s3 = container.get("s3");

// Upload
await s3.saveFile("my-bucket", "path/to/file.png", fileBuffer, "image/png");

// Download
const content = await s3.getFile("my-bucket", "path/to/file.png");

// Delete
await s3.removeFile("my-bucket", "path/to/file.png");

// Create bucket
await s3.createBucket("my-bucket");

// List buckets
const buckets = await s3.listBuckets();
```

## Interactive Storage Extension

Provides a file-browser REST API backed by S3. Mount it as an extension:

```js
const { Kernel, InteractiveStorageExtension } = require("zyket");

const kernel = new Kernel({
  extensions: [new InteractiveStorageExtension()],
});
```

Endpoints added:
- `GET  /storage/browse`
- `POST /storage/upload`
- `GET  /storage/download`
- `GET  /storage/info`
- `POST /storage/create-folder`
- `DELETE /storage/delete`
- `DELETE /storage/delete-folder`

## Creating a Custom Service

1. Extend the `Service` base class.
2. Implement the `boot()` method.
3. Register it in the `Kernel` constructor.

```js
// src/services/mailer.js
const { Service } = require("zyket");
const nodemailer = require("nodemailer");

module.exports = class MailerService extends Service {
  #container;
  transporter;

  constructor(container) {
    super("mailer");
    this.#container = container;
  }

  async boot() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.#container.get("logger").info("Mailer service ready");
  }

  async send({ to, subject, html }) {
    return this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }
};
```

Register it in the entry point:

```js
// index.js
const { Kernel } = require("zyket");
const MailerService = require("./src/services/mailer");

const kernel = new Kernel({
  services: [
    ["mailer", MailerService, ["@service_container"]],
  ],
});

kernel.boot();
```

Use it anywhere you have the container:

```js
await container.get("mailer").send({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<p>Thanks for signing up</p>",
});
```
