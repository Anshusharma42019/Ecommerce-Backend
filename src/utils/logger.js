'use strict';

const winston = require('winston');
const path = require('path');

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const colors = { error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'blue' };
winston.addColors(colors);

const logLevel = process.env.NODE_ENV === 'production' ? 'http' : 'debug';

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

const transports = [new winston.transports.Console({ format: consoleFormat })];

// Only add file transports in non-serverless environments
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
  const DailyRotateFile = require('winston-daily-rotate-file');
  const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
  const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );
  transports.push(
    new DailyRotateFile({ filename: path.join(LOG_DIR, 'error-%DATE%.log'), datePattern: 'YYYY-MM-DD', level: 'error', maxSize: '20m', maxFiles: '30d', format: fileFormat, zippedArchive: true }),
    new DailyRotateFile({ filename: path.join(LOG_DIR, 'combined-%DATE%.log'), datePattern: 'YYYY-MM-DD', maxSize: '20m', maxFiles: '14d', format: fileFormat, zippedArchive: true })
  );
}

const logger = winston.createLogger({
  level: logLevel,
  levels,
  transports,
  exitOnError: false,
});

module.exports = logger;
