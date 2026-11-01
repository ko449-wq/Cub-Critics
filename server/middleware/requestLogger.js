'use strict';
// Gives every request a fresh id (returned in the X-Request-Id header and included in
// error responses and logs, so a problem report can be matched to a log line) and logs
// one line per request when it finishes. Bodies and query strings are never logged.
const crypto = require('node:crypto');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  // Always generate our own id; never trust one sent by the client.
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0];
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[path === '/api/health' && level === 'info' ? 'debug' : level](
      {
        requestId: req.id,
        method: req.method,
        path,
        status: res.statusCode,
        durationMs: Math.round(Number(process.hrtime.bigint() - start) / 1e5) / 10,
        ip: req.ip,
      },
      'request'
    );
  });

  next();
}

module.exports = requestLogger;
