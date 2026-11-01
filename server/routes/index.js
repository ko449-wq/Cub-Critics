'use strict';
// Mounts every route file under /api (see app.js). Feature routes are added here as
// they are built.
const express = require('express');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.use('/health', healthRoutes);

module.exports = router;
