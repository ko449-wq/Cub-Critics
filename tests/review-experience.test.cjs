'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { normalizeApiVenue, ratingWords } = require('../review-experience.js');

test('transforms a real API venue response for the browse cards', () => {
  const venue = normalizeApiVenue({
    id: 12, name: 'Student Union Cafe', category: { id: 2, name: 'Cafe' },
    location: 'University Union', description: 'Breakfast and coffee', avgRating: 4.3,
    reviewCount: 11, openStatus: { isOpen: true }, matchedMenuItems: ['Latte']
  });
  assert.equal(venue.id, 12);
  assert.equal(venue.category, 'Cafe');
  assert.equal(venue.emoji, '☕');
  assert.equal(venue.rating, 4.3);
  assert.equal(venue.reviews, 11);
  assert.equal(venue.open, true);
  assert.deepEqual(venue.menu, ['Latte']);
});

test('unrated API venues are not given made-up scores', () => {
  const venue = normalizeApiVenue({ id: 13, name: 'New Venue', category: { name: 'Dining' }, reviewCount: 0 });
  assert.equal(venue.rating, 0);
  assert.equal(venue.reviews, 0);
  assert.equal(venue.open, false);
});

test('review UI supports 1-5 ratings and explicit workflows', () => {
  assert.deepEqual(ratingWords.slice(1), ['Poor', 'Fair', 'Good', 'Great', 'Excellent']);
  const markup = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const id of ['data-mode','my-reviews','auth-dialog','review-experience.js','review-experience.css','history-dialog','app-toast']) {
    assert.ok(markup.includes(id), `Missing ${id}`);
  }
  const script = fs.readFileSync(path.join(__dirname, '..', 'review-experience.js'), 'utf8');
  for (const endpoint of ['/venues/', '/reviews/', '/auth/', '/users/me/reviews']) {
    assert.ok(script.includes(endpoint), `Missing API path ${endpoint}`);
  }
  assert.match(script, /credentials: 'include'/);
  assert.match(script, /confirm\('Delete your review/);
});
