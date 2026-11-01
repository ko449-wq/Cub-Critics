# Cub Critics server

Node 22 + Express 5 + PostgreSQL 15+ (Sequelize models and migrations).

## Setup

1. `npm install`
2. `cp .env.example .env` and fill in your values
3. Create the database named in `DB_NAME` (or set `DATABASE_URL`)
4. `npm run db:migrate`, then `npm run db:seed` (creates categories, badges, the first
   administrator from `ADMIN_*`, and demo venues in development)
5. `npm run dev` (auto-restarts on changes) or `npm start`

Check it is running: `curl localhost:3001/api/health`

## Scripts

| Command                                  | What it does                             |
| ---------------------------------------- | ---------------------------------------- |
| `npm run dev` / `npm start`              | Run the server                           |
| `npm test`                               | Automated tests (no database needed yet) |
| `npm run lint` / `npm run format`        | Check / auto-format the code             |
| `npm run db:migrate` / `db:migrate:undo` | Apply / undo the latest migration        |
| `npm run db:seed` / `db:seed:undo:all`   | Add / remove seed data                   |

## Layout

routes -> controllers -> services -> models. The first line of every file says what it is
for and which SRS requirements it covers.

## Conventions

- **Controllers** are plain functions wrapped by `createHandler(extractInput, controller)`
  (`utils/handler.js`). They return `{ statusCode?, data? }`; they never touch `res`.
- **Success responses** send `data` as the JSON body, as-is.
- **Errors** are thrown as the classes in `utils/httpExceptions.js` and always come back as
  `{ "error": { "code", "message", "details"?, "requestId" } }`. Validation errors put one
  `{ field, message }` per field in `details`. Unexpected errors return a generic message;
  the real error is only in the server log (look it up by `requestId`).
- **Every response** has an `X-Request-Id` header that matches the `requestId` in error bodies
  and in the log line for that request.
- **Logs** are JSON, one line per request. Passwords, cookies and query strings are never logged.
- **Health**: `GET /api/health` returns 200, or 503 if the database is unreachable.
