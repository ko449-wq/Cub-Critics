'use strict';
// Reads and validates environment variables in one place (SC#8). If anything is
// wrong the server refuses to start and lists every problem at once.
require('dotenv').config({ quiet: true });

const VALID_ENVS = ['development', 'test', 'production'];

function isOrigin(value) {
  try {
    return new URL(value).origin === value;
  } catch {
    return false;
  }
}

function loadConfig(env = process.env) {
  const problems = [];

  const nodeEnv = env.NODE_ENV || 'development';
  if (!VALID_ENVS.includes(nodeEnv)) {
    problems.push(`NODE_ENV must be one of ${VALID_ENVS.join(', ')} (got "${nodeEnv}")`);
  }
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  const port = Number(env.SERVER_PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push('SERVER_PORT must be a whole number between 1 and 65535');
  }

  // Origins of the React app that may call this API from a browser.
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const origin of allowedOrigins) {
    if (!isOrigin(origin)) {
      problems.push(
        `ALLOWED_ORIGINS entry "${origin}" must look like http://localhost:5173 (no path, no trailing slash)`
      );
    }
  }

  // How many reverse proxies sit in front of the app (needed for correct client IPs).
  // Most hosts put exactly one in front, so production defaults to 1.
  const trustProxy =
    env.TRUST_PROXY === undefined || env.TRUST_PROXY === ''
      ? isProduction
        ? 1
        : 0
      : Number(env.TRUST_PROXY);
  if (!Number.isInteger(trustProxy) || trustProxy < 0) {
    problems.push('TRUST_PROXY must be a whole number of 0 or more');
  }

  const sessionSecret = env.SESSION_SECRET || undefined;
  if (
    isProduction &&
    (!sessionSecret || sessionSecret.length < 32 || sessionSecret === 'change_me')
  ) {
    problems.push('SESSION_SECRET must be a random string of at least 32 characters in production');
  }

  // The database settings themselves are read by config/config.js.
  const hasDatabase = Boolean(env.DATABASE_URL) || Boolean(env.DB_NAME && env.DB_USER);
  if (!isTest && !hasDatabase) {
    problems.push(
      'Database is not configured: set DATABASE_URL, or DB_NAME and DB_USER (plus DB_PASSWORD, DB_HOST, DB_PORT)'
    );
  }

  const logLevel = env.LOG_LEVEL || (isTest ? 'silent' : isProduction ? 'info' : 'debug');

  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration:\n - ${problems.join('\n - ')}`);
  }

  return {
    nodeEnv,
    isProduction,
    isTest,
    port,
    allowedOrigins,
    trustProxy,
    sessionSecret,
    logLevel,
  };
}

const config = loadConfig();

module.exports = Object.freeze({ ...config, loadConfig });
