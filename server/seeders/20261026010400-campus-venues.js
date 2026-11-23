'use strict';

//Only edit this VENUES array with the following information in this format
//Venues can ONLY be one of the following: 'Dining Hall', 'Café', 'Grab-and-Go', 'Fast Food'
//Hours are formatted by the following: [[(Days)], (Opening Time), (Closing Time)]
//Days are numbered: 0=Sunday, 6=Saturday
//Times are in Military time format. Days with no hours listed are closed
//For overnight hours, put the closing time after midnight, ex: '18:00', '02:00'.
//Menu items are formatted: [(Item Name), (Description), Price]
const VENUES = [
  {
    name: '7720 Café',
    category: 'Café',
    location: 'Administration Building',
    description: '7720 Café serves signature grill items, made-to-order sandwiches, salad bar and fresh grab-n-go meals. Fuel up with Matriarch Coffee, our local coffee partner. Located in the Administration Building. Order ahead on the Grubhub app.',
    hours: [
      [[1, 2, 3, 4, 5], '07:30', '14:00'],
    ],
    menu: [
        ['The 7720 Club', 'Grilled chicken, bacon, lettuce, tomato, and guacamole on a potato roll.', 8.73],
        ['Black Jack', 'Grilled blackened seasoned chicken breast filet, pepper jack cheese, coleslaw, lettuce, tomato, and red onion on a potato roll.', 8.21],
        ['Cuban Club', 'Grilled chicken breast, smoked bacon, Swiss cheese, ham, dill pickle, crispy onions and Cajun Dijon mayo.', 8.73],
        ['Nashville Chicken Sandwich', 'Chicken tenders, pickles and spicy Nashville ranch sauce on a potato roll.', 8.62],
        ['Chicken Salad Sandwich', '', 8.93],
        ['Tuna Salad Sandwich', '', 8.93],
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements });

    for (const v of VENUES) {
      const [exists] = (await q('SELECT id FROM venues WHERE name = :name', { name: v.name }))[0];
      if (exists) continue;

      const [cat] = (
        await q('SELECT id FROM categories WHERE lower(name) = lower(:c)', { c: v.category })
      )[0];
      if (!cat)
        throw new Error(`Category "${v.category}" is missing; run the categories seeder first.`);

      const [venue] = (
        await q(
          `INSERT INTO venues (name, category_id, description, location)
         VALUES (:name, :cat, :description, :location) RETURNING id`,
          { name: v.name, cat: cat.id, description: v.description, location: v.location }
        )
      )[0];

      const open = new Set();
      for (const [days, opens, closes] of v.hours) {
        for (const d of days) {
          open.add(d);
          await q(
            `INSERT INTO venue_hours (venue_id, day_of_week, opens_at, closes_at)
             VALUES (:venue, :d, :opens, :closes)`,
            { venue: venue.id, d, opens, closes }
          );
        }
      }
      for (let d = 0; d < 7; d += 1) {
        if (!open.has(d)) {
          await q(
            'INSERT INTO venue_hours (venue_id, day_of_week, is_closed) VALUES (:venue, :d, TRUE)',
            { venue: venue.id, d }
          );
        }
      }

      for (const [name, description, price] of v.menu) {
        await q(
          'INSERT INTO menu_items (venue_id, name, description, price) VALUES (:venue, :name, :description, :price)',
          { venue: venue.id, name, description, price }
        );
      }
    }
  },

  async down(queryInterface) {
    // Venue hours and menu items go with the venue (ON DELETE CASCADE). Venues that
    // already have reviews are kept (reviews use RESTRICT), so deleting demo data
    // after testing reviews needs those test reviews removed first.
    await queryInterface.sequelize.query('DELETE FROM venues WHERE name IN (:names)', {
      replacements: { names: VENUES.map((v) => v.name) },
    });
  },
};
