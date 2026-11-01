'use strict';
// Database reachability check used by the health endpoint.
const { sequelize } = require('../models');
const logger = require('../utils/logger');

async function isDatabaseUp() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return false;
  }
}

module.exports = { isDatabaseUp };
