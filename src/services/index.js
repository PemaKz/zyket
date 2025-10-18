const Database = require("./database");
const Cache = require("./cache");
const S3 = require("./s3");
const { SocketIO } = require("./socketio");
const { Express } = require("./express");
const Scheduler = require("./scheduler");
const EventService = require("./events");

const eventsActivated = process.env.DISABLE_EVENTS !== 'true';
const databaseActivated = !!process.env.DATABASE_URL;
const cacheActivated = !!process.env.CACHE_URL;
const bullmqActivated = !!process.env.CACHE_URL && process.env.DISABLE_BULLMQ !== 'true';
const s3Activated = process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY;
const schedulerActivated = process.env.DISABLE_SCHEDULER !== 'true';
const socketActivated = process.env.DISABLE_SOCKET !== 'true';
const expressActivated = process.env.DISABLE_EXPRESS !== 'true';

module.exports = [
  ["logger", require("./logger"), ["@service_container", process.env.LOG_DIRECTORY || `${process.cwd()}/logs`, process.env.DEBUG === "true"]],
  ["template-manager", require("./template-manager"), []],
  eventsActivated ? ["events", EventService, ["@service_container"]] : null,
  databaseActivated ? ["database", Database, ["@service_container", process.env.DATABASE_URL]] : null,
  cacheActivated ? ["cache", Cache, ["@service_container", process.env.CACHE_URL]] : null,
  s3Activated ? ["s3", S3, ["@service_container", process.env.S3_ENDPOINT, process.env.S3_PORT, process.env.S3_USE_SSL === "true", process.env.S3_ACCESS_KEY, process.env.S3_SECRET_KEY]] : null,
  schedulerActivated ? ["scheduler", Scheduler, ["@service_container"]] : null,
  bullmqActivated ? ["bullmq", require("./bullmq"), ["@service_container"]] : null,
  socketActivated ? ["socketio", SocketIO, ["@service_container"]] : null,
  expressActivated ? ["express", Express, ["@service_container"]] : null
].filter(Boolean);