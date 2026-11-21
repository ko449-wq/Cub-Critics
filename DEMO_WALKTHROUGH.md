# Cub Critics — final sprint demo walkthrough

**Audience:** Professor Tirschman and peer reviewers  
**Goal:** Show the complete student workflow, then prove the database read/write using the Express API and PostgreSQL.  
**Important:** The public GitHub Pages preview runs in **browser demo mode** unless `window.CUB_CRITICS_API_BASE` is configured to point to a running API. Its sample venues and saved sample reviews are *not* database data.

## Setup checklist

1. Start PostgreSQL and the backend as described in `server/README.md`; apply migrations and seed data.
2. Configure `ALLOWED_ORIGINS` on the backend to include the exact origin of the frontend website. The backend's default port is **3001**.
3. On the frontend, configure `window.CUB_CRITICS_API_BASE` in `index.html` to `http://localhost:3001/api` for a local demonstration. For a public deployment, use your deployed HTTPS API origin plus `/api` instead. Do not change it to a localhost URL on GitHub Pages for public viewers.
4. Reload the frontend and confirm the banner reads **Live database connected**. Never present the yellow browser-only demo banner as database persistence.
5. Prepare two test student accounts and at least one active dining venue with a menu. Use fictional test student accounts, not real passwords on video.
6. Arrange a database viewer (psql, pgAdmin, or the team's preferred SQL client) beside the site for the data inspection portion. Never reveal password hashes, emails, session tokens, or other private records during the recording.

## Suggested 5–7 minute screen recording and voice-over

| Time | Show on screen | Suggested narration |
| --- | --- | --- |
| 0:00–0:35 | Home page and three-step banner | "Cub Critics helps Towson students discover campus dining, read peer feedback, and rate a venue in one place. We're the Gladiators, and this demo shows our final sprint user workflow." |
| 0:35–1:15 | Search a venue by name and menu item; use a category or sorting | "I can narrow the directory by a restaurant or something I want to eat, then open the venue that interests me." |
| 1:15–2:00 | Open one restaurant, click **Menu & details**, review food/menu and operating hours, switch to **Student reviews** | "Here students can inspect menu information and decide using reviews submitted by other students." |
| 2:00–2:55 | Log in, choose 4 or 5 stars, type a specific constructive review and click **Publish review** | "Students must be logged in to publish. A rating is required; written feedback is optional. The app prevents multiple active reviews for one venue." |
| 2:55–3:40 | Refresh reviews; show your published text; click **Edit review**, update the text, save; open **My reviews** | "This entry can be edited by its author, and the edited state is labeled. The personal review history links back to the venue." |
| 3:40–4:30 | In PostgreSQL, show an appropriately filtered query of review ID, venue ID, rating, body, edited timestamp; verify update | "The review was not just added to browser memory. It was written through the API to the PostgreSQL reviews table, then read back for the website." |
| 4:30–5:00 | Delete the test review after confirmation, revisit database, show row deletion | "Deleting an owned review asks for confirmation. The API removes the record and the page refreshes." |
| 5:00–5:30 | Optional: second student, review report; moderators' queue if implemented | "A student can report another review for moderation. Administrators, not ordinary students, are responsible for moderation." |
| 5:30–6:15 | Show GitHub commits, sprint backlog, testing evidence and feedback | "We incorporated peer feedback into our sprint backlog, shared implementation tasks, ran tests, and brought the revised interaction back into our demo." |
| 6:15–6:40 | Summary | "Our sprint outcome is a clearer dining discovery and review workflow, backed by server authorization and persistence when running in live mode." |

## Database proof checklist

- **READ:** a `GET /api/venues/:id/reviews` response returns a previously saved published review.
- **WRITE:** `POST /api/venues/:id/reviews` creates a record; the API returns its ID.
- **UPDATE:** `PATCH /api/reviews/:id` changes the rating/body and marks it edited.
- **DELETE:** `DELETE /api/reviews/:id` removes an owned record after client confirmation.
- **AUTHORIZATION:** a guest can read, but posting requires login. Another student must not be able to edit/delete the first student's review.
- **ONE REVIEW PER VENUE:** an existing review opens pre-populated for editing. A second POST must not duplicate it.

## How the two frontends differ

**Static browser demo:** sample data; real interactive flow; reviews stored in the browser's localStorage only. Useful for reviewing UX when a backend isn't accessible. Not a database demo.

**Live API mode:** requires running server, configured database, and correct CORS origins/cookies. Login, registration, venue listing, review read/write/edit/delete, and review history use the existing Express endpoints. The UI shows a green **Live database connected** badge only after it receives the expected API responses.

The team still must verify real venue data, public deployment and database connectivity before the final submission. The recording itself must be made by a team member with voice narration, as Jeff specifically requested.
