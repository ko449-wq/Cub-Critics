# Cub Critics · Gladiators

**Towson University · COSC 412 · Fall 2026**

> Early interactive prototype. The published page uses fictional venue names, ratings, hours, review counts, and menus. It is not a production review application.

Cub Critics is a student-led, mobile-friendly campus dining discovery and review project. The target release will allow Towson University students to browse food venues, view menus and operating hours, search/filter results, and rate or review campus dining experiences. Administrators will manage venues and moderate reviews.

## Preview

When GitHub Pages is enabled for the parent repository's `main` branch, the prototype is intended to be available at:

https://ko449-wq.github.io/Cub-Critics/

The preview currently includes a responsive landing page, nine fictional venue cards, menu detail dialogs, keyword search, category filters, sorting, an illustrative availability filter, a random venue picker, and a saved-venue shortlist stored only in the current browser. It also includes keyboard-friendly dialog controls and mobile navigation. **Authentication, real review submissions, moderation, database persistence, and verified campus venue data are not implemented in this static frontend.**

## Team

- **William Brown** — Gladiators project member; led much of the original proposal text.
- **Kolawole Ogunniyi** — Gladiators project member; outlined proposal sections and defined initial ideas.
- **Ayden Gernatt** — Gladiators project member; formatted and expanded the proposal.

These are the proposal contribution descriptions, not permanent engineering role assignments.

## Requirements-led development

The initial software requirements specification (SRS) describes the planned application:

| User | Intended privileges |
| --- | --- |
| Guest / venue staff | Read published venue pages and reviews; use search and filters |
| Registered student | Guest abilities, plus own profile, own ratings/reviews and reporting |
| Administrator | Student abilities, plus review moderation and venue/menu/photo management |

Protected actions must be authorized by the backend; client-side hidden buttons are not security.

## Planned implementation stack

- Frontend: React, HTML, CSS and JavaScript
- Backend: Node.js + Express REST API
- Database: PostgreSQL
- Hosting: To be selected
- Version control: Git / GitHub

**This particular preview** is intentionally plain HTML, CSS and JavaScript so it can run on GitHub Pages without a backend. It is not the final React application.

## Planned sprints

1. **V1.01 — Accounts and venue browsing.** Registration, login, profiles, venue list/details, and API/database foundations.
2. **V1.02 — Ratings, reviews, search and filters.** Real student feedback, aggregate ratings, discovery.
3. **V1.03 — Administration and polishing.** Moderation tools, achievements, mobile usability, security and quality checks.

Non-goals for the initial release include payments, reservations, advertisements, other universities, photo uploads in reviews, and university SSO integration.

## Local preview

Open `index.html` in a browser, or from the `cub-critics` directory run:

```sh
python -m http.server 8000
```

Visit `http://localhost:8000`.

Run dependency-free frontend tests with Node.js 22+:

```sh
node --check app.js
node --test tests/*.test.cjs
```

The frontend smoke-check GitHub Action runs these checks on relevant pull requests. The separate `server/` application has its own setup, environment variables, PostgreSQL dependency and tests.

## Repo layout

```text
cub-critics/
  index.html          Landing page and preview UI
  styles.css          Responsive layout and design
  app.js              Fictional data, search/filter/sort, saved shortlist, venue dialogs
  README.md           Project overview and next steps
  CONTRIBUTING.md     Working agreements
  tests/              Dependency-free Node.js frontend regression tests
  .github/workflows/   Frontend pull-request checks
```

## Engineering notes

- Do not put secrets, real user email addresses, passwords or database credentials in this static directory.
- Keep preview data clearly labeled as fictional; verify venue details before publishing real information.
- Use feature branches + pull requests for team changes.
- Attach requirement IDs (e.g. `FR#24`, `SC#3`) and test evidence to implementation pull requests.
- Keep actual student review submissions out of GitHub Pages until backend authentication, storage, authorization, privacy and moderation are implemented.

## Project provenance

Based on the Gladiators Project Proposal (September 22, 2026), WBS/budget and sprint schedule, and Cub Critics Software Requirements Specification (October 2026). Professor Jeffrey Tirschman is the academic sponsor. This is an independent student course project, not an official university dining service.
