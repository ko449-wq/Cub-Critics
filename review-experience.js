/* Cub Critics review journey. Demo data never pretends to be database data. */
(function (root) {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const STORE = 'cub-critics-demo-reviews-v2';
  const configuredBase = String(root.CUB_CRITICS_API_BASE || '').trim().replace(/\/+$/, '');
  let live = false;
  let unavailable = false;
  let directory = [];
  let user = null;
  let venue = null;
  let selectedRating = 0;
  let editing = null;
  let reviews = [];
  let sort = 'newest';
  let panelToken = 0;
  let afterSignIn = false;
  let onDataChanged = () => {};
  const seededTexts = [
    ['Great spot between classes', 'Quick service and a nice place to grab something between lectures. The menu has a little bit of everything.'],
    ['Would visit again', 'The food hit the spot, and I liked how easy it was to pick something to eat.'],
    ['A few things to improve', 'Good flavors overall. I would love to see more consistency during busy lunch hours.']
  ];
  const seededNames = ['tigerfoodie', 'campuscravings', 'towsonbites'];
  const ratingWords = ['Select a rating', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  function readDemo() {
    try {
      const data = JSON.parse(localStorage.getItem(STORE) || '{}');
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch (_) { return {}; }
  }
  function saveDemo(data) {
    try { localStorage.setItem(STORE, JSON.stringify(data)); return true; }
    catch (_) { message('Browser storage is unavailable. Your review was not saved.', true); return false; }
  }
  function demoFor(id) {
    const record = readDemo()[id];
    return record && Number.isInteger(record.rating) && record.rating >= 1 && record.rating <= 5
      ? { id: 'demo-' + id, rating: record.rating, body: String(record.body || ''), createdAt: record.createdAt, edited: Boolean(record.edited), mine: true, author: { username: 'you · demo student' } }
      : null;
  }
  function demoReviews(id) {
    const sample = seededTexts.map(([title, body], i) => ({
      id: 'sample-' + id + '-' + i,
      rating: [5, 4, 3][(Number(id) + i) % 3],
      title,
      body,
      createdAt: new Date(Date.UTC(2026, 10, 14 - i * 4)).toISOString(),
      mine: false,
      author: { username: seededNames[i] }
    }));
    const mine = demoFor(id);
    return mine ? [mine, ...sample] : sample;
  }
  function message(text, isError = false) {
    const toast = $('app-toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.toggle('is-error', isError);
    toast.hidden = false;
    clearTimeout(message.timer);
    message.timer = setTimeout(() => { toast.hidden = true; }, 4500);
  }
  async function api(path, options = {}) {
    if (!configuredBase) throw new Error('No live API has been configured.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(configuredBase + path, {
        ...options, credentials: 'include', signal: controller.signal,
        headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
      });
      const data = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) {
        const details = data?.error?.details;
        const error = new Error(data?.error?.message || 'Request failed (' + response.status + ').');
        error.code = data?.error?.code;
        error.details = details;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The API did not respond. Please try again.');
      throw error;
    } finally { clearTimeout(timeout); }
  }
  function normalizeApiVenue(item) {
    const category = item.category?.name || 'Dining';
    const icons = { American: '🍔', Asian: '🍜', Pizza: '🍕', Cafe: '☕', Healthy: '🥗', Dessert: '🧁', Sandwiches: '🥙' };
    return {
      id: item.id, name: item.name, category, emoji: icons[category] || '🍽️',
      rating: item.avgRating ?? 0, reviews: item.reviewCount ?? 0,
      open: Boolean(item.openStatus?.isOpen),
      menu: Array.isArray(item.matchedMenuItems) ? item.matchedMenuItems : [],
      tags: item.location ? [item.location] : [category],
      summary: item.description || 'Explore this campus dining destination.',
      colors: ['#f2dcb4', '#d3a26a'], thumbnailUrl: item.thumbnailUrl
    };
  }
  async function connect() {
    if (!configuredBase) { updateMode(); return null; }
    const [result, account] = await Promise.all([api('/venues?sort=rating'), api('/auth/me')]);
    if (!Array.isArray(result?.venues)) throw new Error('The API returned an unexpected venue list.');
    live = true;
    unavailable = false;
    user = account?.user ?? null;
    updateMode();
    directory = result.venues.map(normalizeApiVenue);
    return directory;
  }
  async function searchDirectory(q) {
    const query = q.trim() ? '?q=' + encodeURIComponent(q.trim()) + '&sort=rating' : '?sort=rating';
    const result = await api('/venues' + query);
    directory = (result.venues || []).map(normalizeApiVenue);
    return directory;
  }
  function updateMode(error) {
    if (error) unavailable = true;
    const node = $('data-mode');
    if (node) {
      node.textContent = error ? 'API unavailable · check configuration' : live ? 'Live database connected' : 'Interactive demo · saved in this browser';
      node.classList.toggle('is-live', live);
      node.classList.toggle('is-error', Boolean(error));
    }
    const account = $('account-action');
    if (account) account.textContent = live ? (user ? 'Sign out · ' + user.username : 'Log in / Join') : 'Demo student';
    const note = $('live-note');
    if (note) note.textContent = live
      ? 'The venue directory and review actions are connected to the Cub Critics API. Reviews are stored in PostgreSQL.'
      : 'Demo mode: practice writing and editing a review. Your draft review is stored only in this browser, not in PostgreSQL.';
  }
  function renderStars(rating) {
    const n = Math.max(0, Math.min(5, Number(rating) || 0));
    return '<span class="review-stars" aria-label="' + n + ' out of 5 stars">' + '★'.repeat(n) + '<span>' + '☆'.repeat(5 - n) + '</span></span>';
  }
  function prettyDate(date) {
    const time = new Date(date);
    return Number.isNaN(time.getTime()) ? 'Recently' : time.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function sorted(list) {
    return [...list].sort((a, b) => {
      if (sort === 'highest') return b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'lowest') return a.rating - b.rating || new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }
  function renderReviews() {
    const list = $('review-list');
    if (!list || !venue) return;
    const ordered = sorted(reviews);
    $('review-list-count').textContent = live ? reviews.length + ' recent published reviews' : reviews.length + ' example/demo reviews';
    list.innerHTML = ordered.length ? ordered.map(review => {
      const username = review.mine ? 'Your review' : (review.author?.username || 'Campus student');
      const initial = String(username).slice(0, 1).toUpperCase();
      return '<article class="review-item' + (review.mine ? ' review-mine' : '') + '">' +
        '<div class="review-avatar" aria-hidden="true">' + escape(initial) + '</div><div class="review-item-main">' +
        '<div class="review-item-top"><strong>' + escape(username) + '</strong><span>' + prettyDate(review.createdAt) + (review.edited ? ' · edited' : '') + '</span></div>' +
        renderStars(review.rating) + (review.title ? '<h4>' + escape(review.title) + '</h4>' : '') +
        (review.body ? '<p>' + escape(review.body) + '</p>' : '<p class="review-muted">Star rating only</p>') +
        (review.mine ? (!['flagged','removed'].includes(review.status) ? '<div class="review-inline-actions"><button type="button" data-edit-own>Edit review</button><button type="button" data-delete-own>Delete</button></div>' : '<small class="review-muted">Under moderation</small>') :
          live && user ? '<button class="report-action" type="button" data-report="' + escape(review.id) + '">Report review</button>' : '') +
        '</div></article>';
    }).join('') : '<div class="reviews-empty"><span>✦</span><h4>Be the first to leave a review</h4><p>Your feedback could help another student choose their next meal.</p></div>';
  }
  function renderComposer() {
    const target = $('review-form-area');
    if (!target || !venue) return;
    const mine = reviews.find(review => review.mine);
    const canModify = !mine || !['flagged', 'removed'].includes(mine.status);
    if (unavailable) { target.innerHTML = '<div class="reviews-empty"><h4>Live API unavailable</h4><p>Review submissions are disabled until your team connects the backend. Demo data on this screen is illustrative only.</p></div>'; return; }
    target.innerHTML = '<div class="review-composer-heading"><div><span class="section-kicker">YOUR VOICE MATTERS</span><h3>' + (mine ? 'Update your review' : 'How was your visit?') + '</h3>' +
      '<p>' + (live ? (user ? 'Your review will be saved to the Cub Critics database.' : 'Log in to publish a real review.') : 'Practice the flow — your review stays in this browser.') + '</p></div></div>' +
      (live && !user ? '<button class="btn btn-gold review-signin" type="button" id="review-signin">Log in to write a review ↗</button>' :
      !canModify ? '<p class="review-form-error">This review is under moderation and can no longer be changed.</p>' :
      '<form id="review-form" novalidate><fieldset class="star-field"><legend>Your rating <span>*</span></legend>' +
      '<div class="star-picker" role="radiogroup" aria-label="Star rating">' + [1, 2, 3, 4, 5].map(n =>
        '<button type="button" role="radio" aria-checked="false" class="star-choice" data-star="' + n + '" aria-label="' + n + ' star' + (n > 1 ? 's' : '') + '">★</button>').join('') +
      '<span id="star-caption">Select a rating</span></div></fieldset>' +
      '<label class="review-input-label" for="review-text">Your review <small>(optional)</small></label>' +
      '<textarea id="review-text" maxlength="1000" rows="4" placeholder="What did you order? What stood out? What could improve?">' + escape(mine?.body || '') + '</textarea>' +
      '<div class="review-editor-footer"><span id="review-char-count">0 / 1000 characters</span><span id="review-error" class="review-form-error" role="alert"></span></div>' +
      '<div class="review-submit-row"><button type="submit" class="btn btn-gold" id="review-submit">' + (mine ? 'Save changes' : 'Publish review') + ' <span aria-hidden="true">↗</span></button>' +
      (mine ? '<button type="button" class="review-delete-button" data-delete-own>Delete my review</button>' : '') + '</div></form>');
    selectedRating = mine?.rating || 0;
    editing = mine || null;
    updateStars();
    if ($('review-text')) updateCount();
  }
  function updateStars() {
    document.querySelectorAll('.star-choice').forEach(button => {
      const n = Number(button.dataset.star);
      button.classList.toggle('selected', n <= selectedRating);
      button.setAttribute('aria-checked', String(n === selectedRating));
    });
    if ($('star-caption')) $('star-caption').textContent = ratingWords[selectedRating];
  }
  function updateCount() {
    if ($('review-char-count')) $('review-char-count').textContent = $('review-text').value.length + ' / 1000 characters';
  }
  function showTab(tab) {
    document.querySelectorAll('[data-venue-tab]').forEach(button => {
      const active = button.dataset.venueTab === tab;
      button.setAttribute('aria-selected', String(active));
      button.classList.toggle('is-active', active);
    });
    document.querySelectorAll('[data-tab-panel]').forEach(panel => {
      panel.hidden = panel.dataset.tabPanel !== tab;
    });
  }
  function renderMenu(detail) {
    const target = $('venue-menu-content');
    if (!target) return;
    const items = live ? (detail?.menu?.items || []) : venue.menu.map((name, i) => ({ id: i, name, price: null }));
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const hoursHtml = live && Array.isArray(detail?.hours) ?
      '<section class="venue-more-info"><h3>Opening hours</h3><div class="hours-table">' + detail.hours.map(day => '<div><span>' + days[day.dayOfWeek] + '</span><strong>' + (day.isClosed ? 'Closed' : (day.periods || []).map(period => escape(period.opensAt) + '–' + escape(period.closesAt)).join(', ')) + '</strong></div>').join('') + '</div></section>' : '';
    const locationHtml = live && detail?.location ? '<p class="venue-location">⌖ ' + escape(detail.location) + '</p>' : '';
    target.innerHTML = '<div class="panel-heading"><div><h3>On the menu</h3><p>Explore what this venue serves.</p>' + locationHtml + '</div></div>' +
      (items.length ? '<ul class="rich-menu">' + items.map((item, i) =>
      '<li><div class="menu-icon">' + escape(venue.emoji || '🍽️') + '</div><div><strong>' + escape(item.name) + '</strong>' + (item.description ? '<small>' + escape(item.description) + '</small>' : '') +
      '</div><span class="menu-price">' + (item.price == null ? '0' + (i + 1) : '$' + Number(item.price).toFixed(2)) + '</span></li>').join('') + '</ul>' : '<p class="review-muted">No menu items have been added yet.</p>') +
      '<p class="menu-notice">' + escape(live ? (detail?.menu?.notice || 'Menus and prices may change. Verify at the venue.') : 'Illustrative menu only — not verified campus food or pricing.') + '</p>' + hoursHtml;
  }
  async function loadReviews() {
    const token = ++panelToken;
    if (!live) { reviews = demoReviews(venue.id); renderReviews(); renderComposer(); return; }
    try {
      const [result, mine] = await Promise.all([
        api('/venues/' + venue.id + '/reviews?sort=newest&limit=50'),
        user ? api('/venues/' + venue.id + '/reviews/mine') : Promise.resolve({ review: null })
      ]);
      if (token !== panelToken) return;
      reviews = result.reviews || [];
      if (mine?.review && !reviews.some(item => item.id === mine.review.id)) reviews.unshift({ ...mine.review, mine: true });
      if (mine?.review) reviews = reviews.map(item => item.id === mine.review.id ? { ...item, mine: true, status: mine.review.status } : item);
      renderReviews(); renderComposer();
    } catch (error) {
      if (token !== panelToken) return;
      $('review-list').innerHTML = '<p class="review-form-error">Could not load reviews. ' + escape(error.message) + '</p>';
      renderComposer();
    }
  }
  async function show(nextVenue, tab = 'reviews') {
    venue = nextVenue;
    sort = 'newest';
    ++panelToken;
    const box = $('dialog-content');
    const inner = box?.querySelector('.dialog-inner');
    if (!inner) return;
    const existingMenu = inner.querySelector('.dialog-heading-row');
    if (existingMenu) existingMenu.remove();
    inner.querySelector('.sample-menu')?.remove();
    inner.querySelector('.dialog-warning')?.remove();
    inner.insertAdjacentHTML('beforeend',
      '<div class="venue-workflow"><div><strong>Find it.</strong><span>Explore the menu</span></div><span aria-hidden="true">→</span><div><strong>Read it.</strong><span>See student feedback</span></div><span aria-hidden="true">→</span><div><strong>Rate it.</strong><span>Share your experience</span></div></div>' +
      '<div class="venue-tabs" role="tablist" aria-label="Venue sections"><button type="button" role="tab" data-venue-tab="reviews" aria-selected="true">★ Student reviews</button><button type="button" role="tab" data-venue-tab="menu" aria-selected="false">☰ Menu & details</button></div>' +
      '<section data-tab-panel="reviews" role="tabpanel" class="review-panel"><div class="review-panel-header"><div><span class="section-kicker">COMMUNITY VERDICT</span><h3>What students are saying</h3><p id="review-list-count">Loading reviews…</p></div><label>Sort reviews<select id="review-sort"><option value="newest">Newest first</option><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option><option value="oldest">Oldest first</option></select></label></div>' +
      '<div id="review-list" aria-live="polite"><p class="review-muted">Loading reviews…</p></div><div id="review-form-area" class="review-form-area"></div></section>' +
      '<section data-tab-panel="menu" role="tabpanel" hidden><div id="venue-menu-content"><p class="review-muted">Loading menu…</p></div></section>');
    showTab(tab);
    if (live) {
      try {
        const detail = await api('/venues/' + nextVenue.id);
        if (venue?.id !== nextVenue.id) return;
        renderMenu(detail.venue);
      } catch (error) { if (venue?.id === nextVenue.id) $('venue-menu-content').textContent = 'Could not load menu: ' + error.message; }
    } else renderMenu(null);
    if (venue?.id === nextVenue.id) await loadReviews();
  }
  async function submitReview(event) {
    event.preventDefault();
    if (!venue) return;
    const errorEl = $('review-error');
    if (!selectedRating) { errorEl.textContent = 'Please choose between 1 and 5 stars.'; $('star-caption').focus?.(); return; }
    const body = $('review-text').value.trim();
    if (body.length > 1000) { errorEl.textContent = 'Please keep your review under 1,000 characters.'; return; }
    const submit = $('review-submit');
    submit.disabled = true;
    submit.textContent = 'Saving…';
    try {
      if (live) {
        if (editing) await api('/reviews/' + editing.id, { method: 'PATCH', body: JSON.stringify({ rating: selectedRating, body }) });
        else await api('/venues/' + venue.id + '/reviews', { method: 'POST', body: JSON.stringify({ rating: selectedRating, body }) });
      } else {
        const data = readDemo();
        const old = data[venue.id];
        data[venue.id] = { rating: selectedRating, body, createdAt: old?.createdAt || new Date().toISOString(), edited: Boolean(old) };
        if (!saveDemo(data)) return;
      }
      message(editing ? 'Your review was updated.' : 'Your review was submitted!' + (live ? '' : ' (browser demo)'));
      await loadReviews();
      onDataChanged();
      $('review-list')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message;
    } finally { if (submit.isConnected) submit.disabled = false; }
  }
  async function deleteOwn() {
    const mine = reviews.find(item => item.mine);
    if (!mine || !confirm('Delete your review for ' + venue.name + '? This cannot be undone.')) return;
    try {
      if (live) await api('/reviews/' + mine.id, { method: 'DELETE' });
      else { const data = readDemo(); delete data[venue.id]; if (!saveDemo(data)) return; }
      message('Your review was deleted.');
      await loadReviews();
      onDataChanged();
    } catch (error) { message(error.message, true); }
  }
  function openLogin() {
    if (!live) { message('Demo mode: you can review venues without a real account.'); return; }
    const dialog = $('auth-dialog');
    if (dialog && !dialog.open) dialog.showModal();
  }
  async function authSubmit(event) {
    event.preventDefault();
    const registration = $('auth-form').dataset.mode === 'register';
    const body = { email: $('auth-email').value.trim(), password: $('auth-password').value };
    if (registration) { body.username = $('auth-username').value.trim(); body.acceptTerms = $('auth-terms').checked; }
    const error = $('auth-error');
    error.textContent = '';
    const submit = $('auth-submit');
    submit.disabled = true;
    try {
      const answer = await api('/auth/' + (registration ? 'register' : 'login'), { method: 'POST', body: JSON.stringify(body) });
      user = answer.user;
      updateMode();
      $('auth-dialog').close();
      message('Welcome, ' + user.username + '!');
      if (venue) await loadReviews();
      if (afterSignIn && $('review-form')) $('review-form').scrollIntoView({ block: 'center' });
      afterSignIn = false;
    } catch (err) { error.textContent = err.message; }
    finally { submit.disabled = false; }
  }
  function changeAuthMode() {
    const form = $('auth-form');
    const registration = form.dataset.mode !== 'register';
    form.dataset.mode = registration ? 'register' : 'login';
    $('auth-title').textContent = registration ? 'Join the Cub Critics community' : 'Welcome back, Tiger';
    $('auth-username-wrap').hidden = !registration;
    $('auth-username').required = registration;
    $('auth-terms-wrap').hidden = !registration;
    $('auth-terms').required = registration;
    $('auth-switch').textContent = registration ? 'Already a member? Log in' : 'New here? Create an account';
    $('auth-submit').textContent = registration ? 'Create student account' : 'Log in';
    $('auth-error').textContent = '';
  }
  async function openHistory() {
    const history = $('history-dialog');
    if (!history) return;
    if (!history.open) history.showModal();
    const list = $('history-list');
    try {
      let items;
      if (live) {
        if (!user) { list.innerHTML = '<p>Log in to see your published review history.</p>'; return; }
        items = (await api('/users/me/reviews?limit=50&offset=0')).reviews || [];
      } else {
        items = Object.entries(readDemo()).map(([id, item]) => ({ venue: { id: Number(id), name: directory.find(v => v.id === Number(id))?.name || 'Sample venue' }, rating: item.rating, body: item.body, createdAt: item.createdAt }));
      }
      list.innerHTML = items.length ? items.map(item => '<article class="history-card"><div><strong>' + escape(item.venue?.name || 'Venue') + '</strong><span>' + renderStars(item.rating) + ' · ' + prettyDate(item.createdAt) + '</span><p>' + escape(item.body || 'Star rating only') + '</p></div><button type="button" data-history-venue="' + Number(item.venue?.id) + '">View venue ↗</button></article>').join('') : '<div class="reviews-empty"><h3>No reviews yet</h3><p>Pick a venue to start sharing your food discoveries.</p></div>';
    } catch (error) { list.textContent = 'Unable to load your reviews: ' + error.message; }
  }
  async function reportReview(id) {
    if (!live || !user) return;
    const reasons = await api('/reviews/report-reasons');
    const options = Array.isArray(reasons) ? reasons : (reasons.reasons || []);
    const reason = prompt('Why are you reporting this review?\n' + options.map(option => option.value + ': ' + option.label).join('\n') + '\nEnter one reason code:');
    if (!reason) return;
    if (!options.some(option => option.value === reason.trim())) { message('Select a listed report reason.', true); return; }
    try { await api('/reviews/' + id + '/report', { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) }); message('Report sent to moderators. Thank you.'); }
    catch (error) { message(error.message, true); }
  }
  function init() {
    directory = typeof sampleVenues !== 'undefined' ? sampleVenues : [];
    updateMode();
    $('dialog-content')?.addEventListener('click', event => {
      const tab = event.target.closest('[data-venue-tab]');
      if (tab) { showTab(tab.dataset.venueTab); return; }
      const star = event.target.closest('[data-star]');
      if (star) { selectedRating = Number(star.dataset.star); updateStars(); $('review-error').textContent = ''; return; }
      if (event.target.closest('[data-edit-own]')) { renderComposer(); $('review-form-area').scrollIntoView({ block: 'center', behavior: 'smooth' }); $('review-text')?.focus(); return; }
      if (event.target.closest('[data-delete-own]')) { deleteOwn(); return; }
      if (event.target.closest('#review-signin')) { afterSignIn = true; openLogin(); return; }
      const report = event.target.closest('[data-report]');
      if (report) reportReview(report.dataset.report).catch(error => message(error.message, true));
    });
    $('dialog-content')?.addEventListener('input', event => { if (event.target.id === 'review-text') updateCount(); });
    $('dialog-content')?.addEventListener('submit', event => { if (event.target.id === 'review-form') submitReview(event); });
    $('dialog-content')?.addEventListener('keydown', event => {
      const star = event.target.closest('[data-star]');
      if (star && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); selectedRating = Math.max(1, Math.min(5, selectedRating + (event.key === 'ArrowRight' ? 1 : -1))); updateStars(); $('dialog-content').querySelector('[data-star="' + selectedRating + '"]')?.focus(); }
    });
    $('dialog-content')?.addEventListener('change', event => { if (event.target.id === 'review-sort') { sort = event.target.value; renderReviews(); } });
    $('auth-close')?.addEventListener('click', () => $('auth-dialog').close());
    $('auth-switch')?.addEventListener('click', changeAuthMode);
    $('auth-form')?.addEventListener('submit', authSubmit);
    $('history-close')?.addEventListener('click', () => $('history-dialog').close());
    $('history-dialog')?.addEventListener('click', event => {
      const button = event.target.closest('[data-history-venue]');
      if (button) { $('history-dialog').close(); root.dispatchEvent(new CustomEvent('cub:open-venue', { detail: { id: Number(button.dataset.historyVenue), tab: 'reviews' } })); }
    });
    $('my-reviews')?.addEventListener('click', openHistory);
    $('account-action')?.addEventListener('click', async () => {
      if (!live) { openHistory(); return; }
      if (!user) { openLogin(); return; }
      if (confirm('Sign out of Cub Critics?')) {
        try { await api('/auth/logout', { method: 'POST' }); user = null; updateMode(); await loadReviews(); message('You have been signed out.'); }
        catch (error) { message(error.message, true); }
      }
    });
    $('header-write-review')?.addEventListener('click', () => {
      $('explore')?.scrollIntoView({ behavior: 'smooth' });
      $('search')?.focus({ preventScroll: true });
      message('Choose a restaurant, then select “Write review”.');
    });
    $('hero-review-cta')?.addEventListener('click', () => {
      $('explore')?.scrollIntoView({ behavior: 'smooth' });
      message('Pick a restaurant below to share your rating.');
    });
  }
  const experience = { init, connect, searchDirectory, show, updateMode, message, normalizeApiVenue, get live() { return live; }, set onDataChanged(fn) { onDataChanged = fn; }, get configured() { return Boolean(configuredBase); } };
  root.CubReviewExperience = experience;
  if (typeof module !== 'undefined' && module.exports) module.exports = { normalizeApiVenue, ratingWords };
})(typeof window !== 'undefined' ? window : globalThis);
