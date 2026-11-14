"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { sampleVenues, filterVenues, initialFilters, escapeHtml } = require("../app.js");

const all = () => initialFilters();

test("demo venues have unique identifiers, menus, and usable artwork colors", () => {
  assert.equal(sampleVenues.length, 9);
  assert.equal(new Set(sampleVenues.map(venue => venue.id)).size, sampleVenues.length);
  for (const venue of sampleVenues) {
    assert.ok(venue.menu.length >= 3);
    assert.ok(venue.tags.length >= 1);
    assert.equal(venue.colors.length, 2);
    assert.ok(venue.colors.every(color => /^#[0-9a-f]{6}$/i.test(color)));
  }
});

test("category controls filter Asian venues without affecting other categories", () => {
  const results = filterVenues(sampleVenues, { ...all(), category: "Asian" });
  assert.deepEqual(results.map(venue => venue.name), ["Noodle Lab", "Golden Wok"]);
});

test("search matches categories, tags, and sample menu items without case sensitivity", () => {
  assert.deepEqual(filterVenues(sampleVenues, { ...all(), query: "  TOFU  " }).map(venue => venue.name), ["Noodle Lab"]);
  assert.ok(filterVenues(sampleVenues, { ...all(), query: "vegetarian" }).some(venue => venue.name === "The Green Table"));
  assert.deepEqual(filterVenues(sampleVenues, { ...all(), query: "cupcake" }).map(venue => venue.name), ["Sweet Spot"]);
});

test("multiword search requires every term and handles extra whitespace", () => {
  const results = filterVenues(sampleVenues, { ...all(), query: "rice   bowls" });
  assert.deepEqual(results.map(venue => venue.name), ["Golden Wok"]);
});

test("sample availability toggle excludes fictional closed venues", () => {
  const results = filterVenues(sampleVenues, { ...all(), openOnly: true });
  assert.ok(results.length > 0);
  assert.ok(results.every(venue => venue.open));
});

test("saved-only mode uses a supplied browser shortlist", () => {
  const results = filterVenues(sampleVenues, { ...all(), savedOnly: true }, new Set([4, 8]));
  assert.deepEqual(results.map(venue => venue.name), ["Sweet Spot", "Tiger Pizza"]);
});

test("saved-only, category and availability filters compose", () => {
  const results = filterVenues(sampleVenues,
    { ...all(), savedOnly: true, category: "Pizza", openOnly: true },
    new Set([1, 4, 8]));
  assert.deepEqual(results.map(venue => venue.name), ["Tiger Pizza"]);
});

test("sorting by rating, reviews, or name uses expected ordering", () => {
  assert.equal(filterVenues(sampleVenues, all())[0].name, "Noodle Lab");
  assert.equal(filterVenues(sampleVenues, { ...all(), sort: "reviews" })[0].name, "Tiger Pizza");
  assert.equal(filterVenues(sampleVenues, { ...all(), sort: "name" })[0].name, "Campus Kitchen");
});

test("filters do not mutate the original sample directory", () => {
  const order = sampleVenues.map(venue => venue.id);
  filterVenues(sampleVenues, { ...all(), sort: "name" });
  assert.deepEqual(sampleVenues.map(venue => venue.id), order);
});

test("rendered text is escaped rather than interpreted as HTML", () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  assert.equal(escapeHtml("fish & chips"), "fish &amp; chips");
});

test("page exposes every required interactive control", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const requiredIds = [
    "search", "sort", "categories", "open-only", "saved-only", "saved-count",
    "random-venue", "result-count", "reset-filters", "empty-reset", "venue-grid",
    "empty-state", "venue-dialog", "dialog-content", "dialog-close",
    "interaction-message", "menu-toggle", "main-nav"
  ];
  for (const id of requiredIds) {
    assert.match(html, new RegExp('id="' + id + '"'), "Missing interactive element " + id);
  }
  assert.match(html, /DEMO DATA ONLY/);
  assert.match(html, /All nine venues.*fictional/);
});

test("styles cover card components, action buttons, and responsive navigation", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
  for (const selector of [".card-art", ".card-body", ".card-top-tag", ".filter-btn",
    ".save-button", ".dialog-save", ".saved-toggle", ".surprise-button",
    ".menu-toggle", ".nav.nav-open"]) {
    assert.ok(css.includes(selector), "Missing style for " + selector);
  }
});
