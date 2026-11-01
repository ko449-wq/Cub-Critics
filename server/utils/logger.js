'use strict';
// Structured JSON logger. Secrets are redacted (AL#3: never log passwords).
const pino = require('pino');
const config = require('../config/env');

module.exports = pino({
  level: config.logLevel,
  redact: {
    paths: [
      'password',
      'password_hash',
      '*.password',
      '*.password_hash',
      'req.headers.cookie',
      'req.headers.authorization',
    ],
    censor: '[redacted]',
  },
});
