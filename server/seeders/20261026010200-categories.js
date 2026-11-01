'use strict';

// Starting categories, taken from the "Venue" definition in the SRS glossary
// (dining hall, café, grab-and-go). The final list is TBD-3; admins can add more
// later through the app (SQ#6). Safe to run more than once.
const CATEGORIES = ['Dining Hall', 'Café', 'Grab-and-Go'];

module.exports = {
  async up(queryInterface) {
    for (const name of CATEGORIES) {
      await queryInterface.sequelize.query(
        'INSERT INTO categories (name) VALUES (:name) ON CONFLICT DO NOTHING',
        { replacements: { name } }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM categories WHERE name IN (:names)', {
      replacements: { names: CATEGORIES },
    });
  },
};
