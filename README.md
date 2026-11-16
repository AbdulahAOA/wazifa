# Wazifa

Wazifa is a job marketplace where candidates find opportunities, submit applications, and track their progress. An admin dashboard provides tools to manage jobs, review applications, and manage users.

## Features

- Job search with filters for location, category, salary, employment type, experience, and remote work.
- Candidate accounts, profiles, saved jobs, and in-app notifications.
- Applications with resumes and cover letters, status tracking, and withdrawal.
- Admin tools for publishing and archiving jobs, reviewing applications, managing users, and updating board settings.
- Session authentication, server-side authorization, and protected resume downloads.

## Technology stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, and Lucide icons. PostgreSQL 16 stores application data through Drizzle ORM and postgres.js. Docker Compose runs the local database; tests use isolated in-memory PGlite databases.

## Getting started

You need Node.js 22 or newer, npm, and either Docker Desktop or an existing PostgreSQL server.

```sh
git clone https://github.com/AbdulahAOA/wazifa.git
cd wazifa
npm ci
cp .env.example .env
```

For an existing installation, keep your current `.env` instead of replacing it.

Replace the placeholders in `.env`:

- `DATABASE_URL`: your PostgreSQL connection URL. The bundled database uses `localhost:5434`.
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: credentials for the bundled database, matching `DATABASE_URL`. URL-encode the password in the URL when needed.
- `SESSION_SECRET`: a random secret of at least 32 characters. Generate one with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

See [.env.example](.env.example) for optional settings. Keep real credentials in your private `.env`.

### Database

Start Docker Desktop, then create the local database and apply migrations:

```sh
npm run db:up
npm run db:check
npm run db:migrate
```

If PostgreSQL is still starting, wait a moment and repeat `db:check`. To use an existing PostgreSQL server, configure `DATABASE_URL` and skip `db:up`.

For an existing Docker database, retain its original `COMPOSE_PROJECT_NAME` to keep using the same volume. Do not run `docker compose down -v` unless you intend to delete that data.

To add demo data to a new development database, set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (at least 12 characters), and `SEED_CANDIDATE_PASSWORD` (at least 8 characters), then run:

```sh
npm run db:seed
```

Seeding is optional and writes to the configured database. Existing installations do not need it.

### Run locally

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000). Sign in at `/sign-in`; the admin dashboard is at `/dashboard`. On a newly seeded database, use the administrator credentials you set in `.env`. Public registration creates candidate accounts.

## Development commands

```sh
npm run lint
npm run typecheck
npm test
```

To build and serve the production application:

```sh
npm run build
npm run start
```

The build downloads Google Fonts and requires internet access. Production needs a database connection, a strong session secret, HTTPS, and persistent private upload storage.

## Notes

- Password-reset tokens are supported, but outbound email is not connected. For local development, use `npm run dev:reset-link -- <email>`.
- Resumes are stored privately in `storage/private` by default and downloaded through authorization checks.
- If PGlite tests encounter Windows path errors, run them in WSL with dependencies installed there.
