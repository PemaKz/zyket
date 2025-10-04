const fs = require('fs');

module.exports = class EnvManager {
  static load(secretsPath) {
    this.createEnvFile(secretsPath);
    require("dotenv").config({ path: secretsPath });
  }

  static createEnvFile(secretsPath, overwrite = false) {
    if (fs.existsSync(secretsPath) && !overwrite) return;
    fs.writeFileSync(secretsPath, this.getDefaultSecrets());
  }

  static getDefaultSecrets() {
    const envsToCreate = {
      DEBUG: true,
      PORT: 3000,
      DISABLE_SOCKET: false,
      DISABLE_EXPRESS: false,
      DATABASE_URL: '',
      CACHE_URL: '',
      S3_ENDPOINT: '',
      S3_PORT: '',
      S3_USE_SSL: true,
      S3_ACCESS_KEY: '',
      S3_SECRET_KEY: '',
      LOG_DIRECTORY: "./logs"
    }

    return Object.entries(envsToCreate).reduce((acc, [key, value]) => {
      return `${acc}${key}=${value}\n`;
    }, "");
  }
}