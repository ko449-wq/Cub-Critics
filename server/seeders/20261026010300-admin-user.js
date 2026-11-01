'use strict';

// Creates the first administrator directly in the database, as the SRS requires:
// there is no public admin sign-up (A#6, SC#14).
//
// Credentials come from the environment so no password is ever committed:
//   ADMIN_EMAIL, ADMIN_PASSWORD   (required)
//   ADMIN_USERNAME                (optional, default "admin")
// If ADMIN_EMAIL or ADMIN_PASSWORD is missing, this seeder skips with a warning.
// Safe to run more than once: an existing account with that email is left alone.
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || '').trim();
    const password = process.env.ADMIN_PASSWORD || '';
    const username = (process.env.ADMIN_USERNAME || 'admin').trim();

    if (!email || !password) {
      console.warn(
        '[seed] admin-user skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to create the first administrator.'
      );
      return;
    }
    // Same rule as FR#3: 8+ characters with at least one letter and one number.
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters with a letter and a number.');
    }

    const hash = await bcrypt.hash(password, 12);
    await queryInterface.sequelize.query(
      `INSERT INTO users (email, username, password_hash, role, tos_version, tos_accepted_at)
       VALUES (:email, :username, :hash, 'administrator', :tos, NOW())
       ON CONFLICT DO NOTHING`,
      { replacements: { email, username, hash, tos: process.env.TOS_VERSION || 'seed' } }
    );
  },

  async down(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || '').trim();
    if (!email) return;
    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE lower(email) = lower(:email) AND role = 'administrator'`,
      { replacements: { email } }
    );
  },
};
