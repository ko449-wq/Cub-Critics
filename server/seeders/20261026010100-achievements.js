'use strict';

// FR#16 / FR#58. Thresholds (1, 5, 10, 25) come from FR#16.
// The NAMES are placeholders until TBD-4 is decided: change them here and re-run,
// or edit the rows directly. Safe to run more than once.
const BADGES = [
  { name: 'First Bite', review_threshold: 1 },
  { name: 'Taste Tester', review_threshold: 5 },
  { name: 'Campus Critic', review_threshold: 10 },
  { name: 'Head Critic', review_threshold: 25 },
];

module.exports = {
  async up(queryInterface) {
    for (const b of BADGES) {
      await queryInterface.sequelize.query(
        `INSERT INTO achievements (name, review_threshold) VALUES (:name, :review_threshold)
         ON CONFLICT DO NOTHING`,
        { replacements: b }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM achievements WHERE name IN (:names)', {
      replacements: { names: BADGES.map((b) => b.name) },
    });
  },
};
