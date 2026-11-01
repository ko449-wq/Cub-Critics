'use strict';
// GET /api/health: no login needed; for hosting health checks and uptime monitoring (SQ#1).
const express = require('express');
const { createHandler } = require('../utils/handler');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get(
  '/',
  createHandler(() => ({}), healthController.getHealth)
);

module.exports = router;
