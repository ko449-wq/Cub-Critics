'use strict';
// Reports whether the API and its database are up. 200 when healthy, 503 when the
// database cannot be reached (so a host or monitor can tell). Reveals no internals.
const healthService = require('../services/healthService');

async function getHealth() {
  const databaseUp = await healthService.isDatabaseUp();
  return {
    statusCode: databaseUp ? 200 : 503,
    data: {
      status: databaseUp ? 'ok' : 'degraded',
      database: databaseUp ? 'up' : 'down',
      uptimeSeconds: Math.round(process.uptime()),
      time: new Date().toISOString(),
    },
  };
}

module.exports = { getHealth };
