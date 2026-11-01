'use strict';

// DEVELOPMENT ONLY. Fictional venues so the team can build and test against realistic
// data before the sponsor confirms the real launch list (TBD-3, OR#2). It does nothing
// when NODE_ENV=production. Real venues should be entered through the admin screens
// or a separate seeder, and these "Demo" rows removed (npm run db:seed:undo:all).
//
// Hours are Eastern local time; day 0 = Sunday. A day with no opening period is
// stored as an explicit closed row. "Demo Late Night Grill" closes at 02:00, to
// exercise the past-midnight case. No photos are seeded on purpose, so the
// placeholder-image behavior (FR#22) is exercised.
const VENUES = [
  {
    name: 'Demo Dining Hall',
    category: 'Dining Hall',
    location: 'Demo Building A',
    description: 'All-you-can-eat dining hall with rotating stations.',
    hours: [
      [[1, 2, 3, 4, 5], '07:00', '20:00'],
      [[0, 6], '09:00', '19:00'],
    ],
    menu: [
      ['Grilled Chicken Plate', 'Seasoned chicken with two sides', 8.5],
      ['Veggie Stir Fry', 'Seasonal vegetables over rice', 7.25],
      ['Cheese Pizza Slice', 'Hand-tossed, from the pizza station', 3.0],
    ],
  },
  {
    name: 'Demo Campus Café',
    category: 'Café',
    location: 'Demo Library, ground floor',
    description: 'Coffee, pastries and light sandwiches.',
    hours: [[[1, 2, 3, 4, 5], '08:00', '17:00']],
    menu: [
      ['Latte', 'Espresso with steamed milk', 4.25],
      ['Blueberry Muffin', 'Baked daily', 2.75],
      ['Turkey Sandwich', 'Turkey, lettuce and tomato on wheat', 6.5],
    ],
  },
  {
    name: 'Demo Grab & Go',
    category: 'Grab-and-Go',
    location: 'Demo Student Center',
    description: 'Pre-made wraps, snacks and drinks between classes.',
    hours: [[[1, 2, 3, 4, 5], '09:00', '16:00']],
    menu: [
      ['Chicken Wrap', 'Grilled chicken, greens, ranch', 6.75],
      ['Fruit Cup', 'Seasonal fruit', 3.25],
      ['Bottled Water', '16 oz', 1.75],
    ],
  },
  {
    name: 'Demo Noodle Bar',
    category: 'Grab-and-Go',
    location: 'Demo Student Center',
    description: 'Made-to-order noodle bowls and dumplings.',
    hours: [
      [[1, 2, 3, 4, 5], '11:00', '14:00'],
      [[1, 2, 3, 4], '17:00', '20:00'],
    ],
    menu: [
      ['Chicken Ramen', 'Broth, noodles, chicken, egg', 9.0],
      ['Veggie Dumplings', 'Six pieces, steamed', 5.5],
      ['Iced Tea', 'Unsweetened', 2.5],
    ],
  },
  {
    name: 'Demo Late Night Grill',
    category: 'Dining Hall',
    location: 'Demo Residence Hall',
    description: 'Burgers and fries into the night on weekends.',
    hours: [
      [[1, 2, 3, 4], '17:00', '22:00'],
      [[5, 6], '18:00', '02:00'],
    ],
    menu: [
      ['Cheeseburger', 'Beef patty, cheddar, pickles', 7.5],
      ['Fries', 'Crispy, salted', 3.5],
      ['Milkshake', 'Vanilla, chocolate or strawberry', 4.75],
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    if (process.env.NODE_ENV === 'production') return;
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
