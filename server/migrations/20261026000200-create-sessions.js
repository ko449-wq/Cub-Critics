'use strict';

// Server-side sessions for connect-pg-simple (configure it with tableName: 'sessions').
// user_id is an extra column so every session of a user can be revoked at once
// (logout everywhere, account deactivation: SC#13). The login code sets it.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE sessions (
          sid     VARCHAR NOT NULL PRIMARY KEY,
          sess    JSON NOT NULL,
          expire  TIMESTAMPTZ NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX sessions_expire_idx  ON sessions (expire);
        CREATE INDEX sessions_user_id_idx ON sessions (user_id);
      `,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS sessions;');
  },
};
