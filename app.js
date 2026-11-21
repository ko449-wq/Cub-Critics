/* Cub Critics — static interactive concept. Venue data, ratings and status are fictional. */
"use strict";

const sampleVenues = [
  { id: 1, name: "Campus Kitchen", category: "American", emoji: "🍔", rating: 4.7, reviews: 43, open: true, menu: ["Smash burgers", "Crispy chicken sandwich", "Seasoned fries"], tags: ["Comfort food", "Quick lunch"], summary: "A cozy campus-style stop for classic comfort food.", colors: ["#f7d69d", "#d88b58"] },
  { id: 2, name: "Golden Wok", category: "Asian", emoji: "🍜", rating: 4.5, reviews: 35, open: true, menu: ["Build-your-own rice bowl", "Garlic noodles", "Sesame vegetables"], tags: ["Rice bowls", "Warm meals"], summary: "Colorful bowls, noodles, and a fast lunch between classes.", colors: ["#f8d5ad", "#e9a060"] },
  { id: 3, name: "The Green Table", category: "Healthy", emoji: "🥗", rating: 4.4, reviews: 27, open: false, menu: ["Harvest salad", "Grain bowl", "Garden wrap"], tags: ["Fresh", "Vegetarian options"], summary: "A bright, fresh-food concept built around easy feel-good bites.", colors: ["#d4e6bb", "#93bca0"] },
  { id: 4, name: "Tiger Pizza", category: "Pizza", emoji: "🍕", rating: 4.3, reviews: 52, open: true, menu: ["Classic cheese slice", "Pepperoni slice", "Garlic breadsticks"], tags: ["Grab a slice", "Group favorite"], summary: "An all-day slice stop imagined for busy campus days.", colors: ["#f7d3a9", "#de8d6f"] },
  { id: 5, name: "Morning Mug", category: "Cafe", emoji: "☕", rating: 4.6, reviews: 30, open: false, menu: ["Cold brew", "Toasted bagel", "Blueberry muffin"], tags: ["Coffee", "Study break"], summary: "Coffee, little treats, and an inviting spot to recharge.", colors: ["#eadac9", "#b8a18f"] },
  { id: 6, name: "Spice Street", category: "International", emoji: "🌮", rating: 4.2, reviews: 21, open: true, menu: ["Street-style tacos", "Seasoned rice plate", "Vegetarian plate"], tags: ["Bold flavors", "Made to order"], summary: "A playful mix of satisfying dishes and punchy flavors.", colors: ["#f4cea1", "#df9b60"] },
  { id: 7, name: "Noodle Lab", category: "Asian", emoji: "🍲", rating: 4.8, reviews: 24, open: true, menu: ["Spicy ramen", "Ginger broth", "Crispy tofu"], tags: ["Noodles", "Comfort bowl"], summary: "Build a warm noodle bowl for a cozy study-day reset.", colors: ["#e4d2a4", "#c9ac71"] },
  { id: 8, name: "Sweet Spot", category: "Dessert", emoji: "🧁", rating: 4.6, reviews: 19, open: false, menu: ["Vanilla cupcake", "Chocolate cookie", "Strawberry sundae"], tags: ["Desserts", "Treat yourself"], summary: "An imaginary dessert counter for the sweetest breaks.", colors: ["#f6d7de", "#dbaabc"] },
  { id: 9, name: "Wrap House", category: "Sandwiches", emoji: "🥙", rating: 4.5, reviews: 31, open: true, menu: ["Grilled chicken wrap", "Falafel wrap", "Hummus bowl"], tags: ["Handheld", "Plant-based option"], summary: "Fresh wraps and filling bowls for lunch on the move.", colors: ["#e5dfb0", "#b9c78e"] }
];

const categoryIcons = { All: "✦", American: "🍔", Asian: "🍜", Healthy: "🥬", Pizza: "🍕", Cafe: "☕", International: "🌮", Dessert: "🧁", Sandwiches: "🥙" };
const storageKey = "cub-critics-saved-venues-v1";
const initialFilters = () => ({ query: "", category: "All", sort: "rating", openOnly: false, savedOnly: false });
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function filterVenues(venues, filters, saved = new Set()) {
  const query = (filters.query || "").toLowerCase().trim().replace(/\s+/g, " ");
  const words = query.split(" ").filter(Boolean);
  return venues.filter(venue => {
    if (filters.category !== "All" && filters.category !== venue.category) return false;
    if (filters.openOnly && !venue.open) return false;
    if (filters.savedOnly && !saved.has(venue.id)) return false;
    const haystack = [venue.name, venue.category, venue.summary, ...venue.menu, ...venue.tags].join(" ").toLowerCase();
    return words.every(word => haystack.includes(word));
  }).sort((a, b) => {
    if (filters.sort === "name") return a.name.localeCompare(b.name);
    if (filters.sort === "reviews") return b.reviews - a.reviews || b.rating - a.rating;
    return b.rating - a.rating || b.reviews - a.reviews;
  });
}

function loadSaved() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return new Set(Array.isArray(stored) ? stored.filter(id => Number.isSafeInteger(id) && id > 0) : []);
  } catch (_) {
    return new Set();
  }
}

function init() {
  const $ = id => document.getElementById(id);
  const grid = $("venue-grid");
  if (!grid) return;
  const filters = initialFilters();
  const saved = loadSaved();
  let activeVenues = sampleVenues;
  let liveSource = false;
  let searchTimer;
  let searchSeq = 0;
  const categoryContainer = $("categories");
  const dialog = $("venue-dialog");
  let lastDialogTrigger = null;

  const announce = message => { $("interaction-message").textContent = message; };
  const saveToBrowser = () => {
    try { window.localStorage.setItem(storageKey, JSON.stringify([...saved])); }
    catch (_) { announce("Saved venues cannot be stored in this browser session."); }
  };

  function renderCategories() {
    const categories = ["All", ...new Set(activeVenues.map(venue => venue.category))];
    categoryContainer.innerHTML = categories.map(category => {
    const count = category === "All" ? activeVenues.length : activeVenues.filter(venue => venue.category === category).length;
    return '<button class="filter-btn" type="button" data-category="' + escapeHtml(category) + '" aria-pressed="false"><span aria-hidden="true">' +
      escapeHtml(categoryIcons[category] || "✦") + '</span> ' + escapeHtml(category) + ' <span class="chip-count">' + count + '</span></button>';
  }).join("");
  }
  renderCategories();

  function render() {
    const matches = filterVenues(activeVenues, liveSource ? { ...filters, query: "" } : filters, saved);
    categoryContainer.querySelectorAll("[data-category]").forEach(button => {
      const active = button.dataset.category === filters.category;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    $("saved-only").classList.toggle("active", filters.savedOnly);
    $("saved-only").setAttribute("aria-pressed", String(filters.savedOnly));
    $("saved-count").textContent = String(saved.size);
    $("result-count").textContent = matches.length + " of " + activeVenues.length + (liveSource ? " campus venues" : " sample venues");
    $("random-venue").disabled = matches.length === 0;
    grid.hidden = matches.length === 0;
    $("empty-state").hidden = matches.length > 0;
    grid.innerHTML = matches.map(venue => {
      const isSaved = saved.has(venue.id);
      const countLabel = liveSource ? 'verified in database' : 'fictional';
      return '<article class="venue-card" style="--card-light:' + venue.colors[0] + ';--card-dark:' + venue.colors[1] + '">' +
        '<div class="card-art"><span class="card-top-tag">' + (liveSource ? '✦ CAMPUS VENUE' : '✦ CONCEPT VENUE') + '</span>' +
        '<span class="food-emoji" aria-hidden="true">' + venue.emoji + '</span>' +
        '<button class="save-button' + (isSaved ? ' is-saved' : '') + '" type="button" data-save="' + venue.id + '" aria-pressed="' + isSaved + '" aria-label="' + (isSaved ? 'Remove ' : 'Save ') + escapeHtml(venue.name) + (isSaved ? ' from saved venues' : ' to saved venues') + '">' +
        (isSaved ? '♥' : '♡') + '</button></div>' +
        '<div class="card-body"><div class="card-topline"><span class="card-category">' + escapeHtml(venue.category) + '</span>' +
        '<span class="hours-status' + (venue.open ? ' open' : '') + '"><span class="status-dot"></span>' + (liveSource ? (venue.open ? 'Open now' : 'Closed now') : (venue.open ? 'Sample open' : 'Sample closed')) + '</span></div>' +
        '<h3>' + escapeHtml(venue.name) + '</h3><p class="card-desc">' + escapeHtml(venue.summary) + '</p>' +
        '<div class="card-tags">' + venue.tags.map(tag => '<span>' + escapeHtml(tag) + '</span>').join("") + '</div>' +
        '<div class="card-bottom"><div class="card-rating"><span class="star" aria-hidden="true">★</span><strong>' + (venue.reviews ? venue.rating.toFixed(1) : 'New') + '</strong><span> (' + venue.reviews + ' ' + countLabel + ')</span></div>' +
        '<div class="card-actions"><button type="button" class="details-button" data-venue="' + venue.id + '" data-tab="reviews" aria-label="Read reviews for ' + escapeHtml(venue.name) + '">Read reviews ↗</button>' +
        '<button type="button" class="card-review-button" data-venue="' + venue.id + '" data-tab="reviews" aria-label="Write a review for ' + escapeHtml(venue.name) + '">★ Write review</button></div></div></div></article>';
    }).join("");
  }

  function showVenue(venue, trigger, tab = "reviews") {
    if (!venue) return;
    lastDialogTrigger = trigger || document.activeElement;
    const isSaved = saved.has(venue.id);
    $("dialog-content").innerHTML =
      '<div class="dialog-art" style="--card-light:' + venue.colors[0] + ';--card-dark:' + venue.colors[1] + '">' +
      '<span aria-hidden="true">' + venue.emoji + '</span><span class="dialog-art-label">' + (liveSource ? 'CAMPUS DINING' : 'INTERACTIVE DEMO') + '</span></div>' +
      '<div class="dialog-inner"><span class="section-kicker">' + (liveSource ? 'TOWSON DINING DIRECTORY' : 'CUB CRITICS SAMPLE') + '</span><h2 id="dialog-title">' + escapeHtml(venue.name) + '</h2>' +
      '<p>' + escapeHtml(venue.summary) + '</p><div class="dialog-stats">' +
      '<span>★ ' + venue.rating.toFixed(1) + ' fictional rating</span><span>' + venue.reviews + ' sample reviews</span><span>' + (liveSource ? (venue.open ? 'Open now' : 'Closed now') : (venue.open ? 'Sample open' : 'Sample closed')) + '</span></div>' +
      '<div class="dialog-heading-row"><h3>What’s on the sample menu?</h3>' +
      '<button class="dialog-save' + (isSaved ? ' is-saved' : '') + '" data-save="' + venue.id + '" type="button" aria-pressed="' + isSaved + '">' +
      (isSaved ? '♥ Saved' : '♡ Save venue') + '</button></div>' +
      '<ul class="sample-menu">' + venue.menu.map((item, index) => '<li><span>' + escapeHtml(item) + '</span><small>0' + (index + 1) + '</small></li>').join("") + '</ul>' +
      '<p class="dialog-warning"><strong>Prototype only.</strong> These names, ratings, sample hours, menu items and review counts are fictional. Real menus and student reviews are not connected yet.</p></div>';
    if (!dialog.open) dialog.showModal();
    if (window.CubReviewExperience) window.CubReviewExperience.show(venue, tab);
    $("dialog-close").focus();
  }

  function toggleSave(id, origin) {
    const venue = activeVenues.find(item => item.id === id);
    if (!venue) return;
    const wasSaved = saved.has(id);
    if (wasSaved) saved.delete(id);
    else saved.add(id);
    const fromGrid = Boolean(origin && grid.contains(origin));
    saveToBrowser();
    render();
    const dialogButton = $("dialog-content").querySelector("[data-save]");
    if (dialog.open && dialogButton && Number(dialogButton.dataset.save) === id) {
      dialogButton.classList.toggle("is-saved", !wasSaved);
      dialogButton.setAttribute("aria-pressed", String(!wasSaved));
      dialogButton.textContent = wasSaved ? "♡ Save venue" : "♥ Saved";
    }
    if (fromGrid) {
      const replacement = grid.querySelector('[data-save="' + id + '"]');
      if (replacement) replacement.focus();
      else $("saved-only").focus();
    }
    announce(venue.name + (wasSaved ? " removed from saved venues." : " saved to this browser."));
  }

  function reset() {
    Object.assign(filters, initialFilters());
    $("search").value = "";
    $("sort").value = "rating";
    $("open-only").checked = false;
    if (liveSource) { ++searchSeq; clearTimeout(searchTimer); refreshLive(); }
    render();
    announce("Filters cleared. Your saved venues were kept.");
  }

  $("search").addEventListener("input", event => {
    filters.query = event.target.value;
    if (!liveSource) { render(); return; }
    clearTimeout(searchTimer);
    const seq = ++searchSeq;
    searchTimer = setTimeout(async () => {
      try {
        const results = await window.CubReviewExperience.searchDirectory(filters.query);
        if (seq !== searchSeq) return;
        activeVenues = results;
        renderCategories();
        render();
      } catch (error) { window.CubReviewExperience.message('Search failed: ' + error.message, true); }
    }, 230);
  });
  $("sort").addEventListener("change", event => { filters.sort = event.target.value; render(); });
  $("open-only").addEventListener("change", event => { filters.openOnly = event.target.checked; render(); });
  $("saved-only").addEventListener("click", () => { filters.savedOnly = !filters.savedOnly; render(); });
  categoryContainer.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    filters.category = button.dataset.category;
    render();
    button.focus();
  });
  $("reset-filters").addEventListener("click", reset);
  $("empty-reset").addEventListener("click", () => { reset(); $("search").focus(); });
  $("random-venue").addEventListener("click", event => {
    const matches = filterVenues(activeVenues, liveSource ? { ...filters, query: "" } : filters, saved);
    if (matches.length) showVenue(matches[Math.floor(Math.random() * matches.length)], event.currentTarget);
  });
  grid.addEventListener("click", event => {
    const saveButton = event.target.closest("[data-save]");
    if (saveButton) { toggleSave(Number(saveButton.dataset.save), saveButton); return; }
    const detailsButton = event.target.closest("[data-venue]");
    if (detailsButton) showVenue(activeVenues.find(venue => venue.id === Number(detailsButton.dataset.venue)), detailsButton, detailsButton.dataset.tab || "reviews");
  });
  $("dialog-content").addEventListener("click", event => {
    const button = event.target.closest("[data-save]");
    if (button) toggleSave(Number(button.dataset.save), button);
  });
  $("dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    if (lastDialogTrigger && lastDialogTrigger.isConnected) lastDialogTrigger.focus();
    else $("search").focus();
  });
  document.addEventListener("keydown", event => {
    const tag = document.activeElement?.tagName;
    if (event.key === "/" && !event.ctrlKey && !event.altKey && !event.metaKey &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(tag) && !document.activeElement?.isContentEditable && !dialog.open) {
      event.preventDefault();
      $("search").focus();
    }
  });

  const menuButton = $("menu-toggle");
  const nav = $("main-nav");
  if (menuButton && nav) {
    const closeMenu = () => { menuButton.setAttribute("aria-expanded", "false"); nav.classList.remove("nav-open"); };
    menuButton.addEventListener("click", () => {
      const opening = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(opening));
      nav.classList.toggle("nav-open", opening);
    });
    nav.addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && nav.classList.contains("nav-open")) { closeMenu(); menuButton.focus(); } });
    document.addEventListener("click", event => { if (!nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu(); });
  }
  async function refreshLive() {
    if (!liveSource) { render(); return; }
    try {
      activeVenues = await window.CubReviewExperience.searchDirectory(filters.query);
      renderCategories();
      render();
    } catch (error) { window.CubReviewExperience.message('Could not refresh venues: ' + error.message, true); }
  }
  window.addEventListener('cub:open-venue', event => {
    const target = activeVenues.find(item => item.id === event.detail?.id);
    if (target) showVenue(target, $('my-reviews'), event.detail?.tab || 'reviews');
  });
  if (window.CubReviewExperience) {
    window.CubReviewExperience.init();
    window.CubReviewExperience.onDataChanged = refreshLive;
  }
  render();
  if (window.CubReviewExperience?.configured) {
    window.CubReviewExperience.connect().then(venues => {
      if (!venues) return;
      liveSource = true;
      activeVenues = venues;
      renderCategories();
      render();
    }).catch(error => {
      window.CubReviewExperience.updateMode(error);
      window.CubReviewExperience.message('The API could not connect: ' + error.message, true);
    });
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { sampleVenues, filterVenues, initialFilters, escapeHtml };
}