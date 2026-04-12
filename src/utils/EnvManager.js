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
    const header = `# Zyket Environment Configuration
# CACHE_URL: Leave empty or set to 'memory' for in-memory cache, or 'redis://localhost:6379' for Redis
`;
    const envsToCreate = {
      DEBUG: true,
      PORT: 3000,
      DISABLE_SOCKET: true,
      DISABLE_EXPRESS: false,
      DISABLE_EVENTS: true,
      DISABLE_BULLMQ: true,
      DISABLE_SCHEDULER: true,
      DATABASE_URL: './database.sqlite',
      DATABASE_DIALECT: 'sqlite',
      CACHE_URL: '',
      S3_ENDPOINT: '',
      S3_PORT: '',
      S3_USE_SSL: true,
      S3_ACCESS_KEY: '',
      S3_SECRET_KEY: '',
      LOG_DIRECTORY: "./logs",
      QUEUES: '',
      VITE_ROOT: './frontend',
      VITE_PORT: 5173,
      DISABLE_VITE: true,
    }

    return header + Object.entries(envsToCreate).reduce((acc, [key, value]) => {
      return `${acc}${key}=${value}\n`;
    }, "");
  }

  static addEnvVariable(secretsPath, key, value) {
    // Create env file if it doesn't exist
    if (!fs.existsSync(secretsPath)) {
      this.createEnvFile(secretsPath);
    }

    // Read existing content
    let envContent = fs.readFileSync(secretsPath, 'utf-8');

    // Check if the key already exists
    const keyRegex = new RegExp(`^${key}=.*$`, 'm');
    if (keyRegex.test(envContent)) {
      return false; // Key already exists
    }

    // Add the new environment variable
    envContent += `${key}=${value}\n`;
    fs.writeFileSync(secretsPath, envContent);
    return true; // Key added successfully
  }
}