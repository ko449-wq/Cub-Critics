require('dotenv').config({ quiet: true });

// Used by sequelize-cli (migrations) and, later, by models/index.js.
// Set DATABASE_URL if your host gives you one (most do); otherwise use the DB_* values.
// Nothing here depends on a specific hosting provider (SQ#5, TBD-2).
const fromUrl = process.env.DATABASE_URL
  ? { use_env_variable: 'DATABASE_URL' }
  : {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
    };

const common = {
  ...fromUrl,
  dialect: 'postgres',
  logging: false,
  // Many hosted Postgres services require SSL; turn on with DB_SSL=true.
  dialectOptions:
    process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
};

module.exports = {
  development: common,
  test: common,
  production: common,
};
