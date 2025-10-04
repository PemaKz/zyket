const Database = require("./database");
const Cache = require("./cache");
const S3 = require("./s3");
const { SocketIO } = require("./socketio");
const { Express } = require("./express");

module.exports = [
  ["logger", require("./logger"), ["@service_container", process.env.LOG_DIRECTORY || `${process.cwd()}/logs`, process.env.DEBUG === "true"]],
  ["template-manager", require("./template-manager"), []],
  process.env.DATABASE_URL ? ["database", Database, ["@service_container", process.env.DATABASE_URL]] : null,
  process.env.CACHE_URL ? ["cache", Cache, ["@service_container", process.env.CACHE_URL]] : null,
  (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) ? ["s3", S3, ["@service_container", process.env.S3_ENDPOINT, process.env.S3_PORT, process.env.S3_USE_SSL === "true", process.env.S3_ACCESS_KEY, process.env.S3_SECRET_KEY]] : null,
  process.env.DISABLE_SOCKET !== 'true' ? ["socketio", SocketIO, ["@service_container"]] : null,
  process.env.DISABLE_EXPRESS !== 'true' ? ["express", Express, ["@service_container"]] : null
].filter(Boolean);