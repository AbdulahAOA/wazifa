# Wazifa

Wazifa is a job marketplace built with Next.js. Candidates can find opportunities, submit resumes, and track applications, while administrators manage listings, review candidates, and operate the board from a dedicated dashboard. Both interfaces use the same PostgreSQL database.

## Features

- Search and filter jobs by keyword, location, category, salary, employment type, experience, and remote availability.
- Browse featured opportunities, recent listings, categories, and hiring statistics.
- Create a candidate account, manage a profile, save jobs, and receive in-app notifications.
- Apply with a resume and cover letter, track application status, and withdraw applications.
- Manage job drafts, publishing, closing, and archiving through the admin dashboard.
- Review applications, manage users, search administrative records, and configure board settings.
- Server-side authorization, password hashing, cookie sessions, password-reset tokens, and protected resume downloads.
- Responsive interface with a bold, high-contrast visual style.

## Technology stack

| Area | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Base UI / Radix UI, Lucide icons |
| Database | PostgreSQL 16, Drizzle ORM, postgres.js |
| Local database | Docker Compose with a persistent named volume |
| Checks | ESLint, TypeScript, Node.js test runner via tsx |
| Test database | Isolated in-memory PGlite databases |

## Requirements

- Node.js 22 or newer and npm.
- Docker Desktop with the Linux engine running, or an existing PostgreSQL instance.
- Internet access for the initial dependency installation and Google Fonts downloads during a production build.

The repository is self-contained. Open the `wazifa` folder directly in VS Code; no files, packages, or configuration in its parent folder are required.

## Installation

Clone the repository into a folder named `wazifa`, then run the following commands from that folder:

```powershell
cd wazifa
npm ci
Copy-Item .env.example .env
```

For an existing installation, **keep your existing `.env`** instead of copying over it. `npm ci` installs the versions recorded in the lockfile without upgrading dependencies.

### Environment configuration

Edit your private `.env` and replace every `replace-with-*` placeholder. Generate a session secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Required PostgreSQL connection URL. The bundled database listens on `localhost:5434`. |
| `SESSION_SECRET` | Random secret of at least 32 characters; required at production runtime and recommended locally. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Required by the bundled Compose service. Match these to `DATABASE_URL`. |
| `COMPOSE_PROJECT_NAME` | Stable Compose identity; defaults to `wazifa` for new installations. Keep the original value for an existing database. |
| `SEED_ADMIN_EMAIL` | Administrator email used only by the optional development seed. |
| `SEED_ADMIN_PASSWORD` | Unique seed administrator password, at least 12 characters. |
| `SEED_CANDIDATE_PASSWORD` | Unique seed candidate password, at least 8 characters. |
| `UPLOAD_DIR` | Optional private resume directory; defaults to `storage/private`. |
| `COOKIE_SECURE` | Optional locally; set `false` for local HTTP. Production always uses Secure cookies. |

Use the raw database password for `POSTGRES_PASSWORD` and a URL-encoded version in `DATABASE_URL` if it contains reserved characters. The example file contains placeholders only and cannot be used as working credentials.

Use the root `.env` for values needed by both Next.js and the CLI scripts. Keep credentials server-side; never prefix a secret with `NEXT_PUBLIC_`. Real environment files, private uploads, generated session secrets, and local database files are ignored by Git.

### Database setup

For a **new local database**, start Docker Desktop, configure the Compose variables above, and run:

```powershell
npm run db:up
npm run db:check
npm run db:migrate
```

If PostgreSQL is still starting, wait until it is healthy and repeat `npm run db:check`. The default host port is `5434`, and Compose stores data in the named `wazifa_pg` volume under its project identity.

To use an existing PostgreSQL server, set `DATABASE_URL`, skip `db:up`, and run `db:check` before applying migrations. The application uses PostgreSQL at runtime; PGlite is used only by the isolated tests.

For an existing Docker installation, retain its original `COMPOSE_PROJECT_NAME` when renaming or moving the project. Otherwise Compose may select a new, empty volume. Do not rename the volume, reset the database, or run `docker compose down -v` to resolve a path change. Changing `POSTGRES_*` values does not change credentials inside an already initialized volume.

### Optional development data

On a **new development database**, you can create demo jobs, candidates, and the administrator after setting the seed variables:

```powershell
npm run db:seed
```

Seeding writes data. It is not required to run an existing installation and should not be run against a database you want to keep unchanged. The script leaves an existing administrator's password unchanged and refuses production seeding by default.

## Run locally

```powershell
npm run dev
```

- Homepage: <http://localhost:3000>
- Jobs: <http://localhost:3000/jobs>
- Sign in: <http://localhost:3000/sign-in>
- Admin dashboard: <http://localhost:3000/dashboard>

Unauthenticated dashboard visits redirect to the sign-in page. On a newly seeded database, use the administrator email and password you set in `.env`. Public registration creates candidate accounts only; an email containing `admin` does not grant administrative access.

Run one development server per checkout. Stop it with `Ctrl+C` before moving the folder or running a production build.

### Production build

```powershell
npm run build
npm run start
```

Production runtime requires a working `DATABASE_URL`, a strong `SESSION_SECRET`, HTTPS for secure session cookies, and persistent private upload storage. `npm run start` serves the compiled build; use `npm run dev` for normal local HTTP development.

## Verification and scripts

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run db:check
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build and validate route types. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Check source files with ESLint. |
| `npm run typecheck` | Check TypeScript without emitting application files. |
| `npm test` | Run workflow and authorization tests against isolated PGlite databases. |
| `npm run db:up` | Start the bundled persistent PostgreSQL service. |
| `npm run db:check` | Probe database connectivity without applying migrations. |
| `npm run db:migrate` | Apply the versioned database schema migrations. |
| `npm run db:seed` | Write optional development data. |
| `npm run db:verify` | Insert, update, and delete a temporary verification job; this writes to the configured database. |
| `npm run dev:reset-link -- <email>` | Generate a local development password-reset link. Treat its output as a credential. |

The optional `scripts/verify-login-credentials.ts` diagnostic reads `VERIFY_CANDIDATE_OLD_PASSWORD` and `VERIFY_CANDIDATE_NEW_PASSWORD` from your private `.env`. Supply your own diagnostic values; no account passwords are bundled in the script. The disposable-candidate utility generates a random password.

The PGlite test engine can encounter Windows path/URL errors on some installations. If that occurs, run the unchanged test suite in a supported Linux environment such as WSL, with dependencies installed inside that environment. The runtime database remains PostgreSQL.

## Project structure

```text
app/                  Public routes, admin routes, API endpoints, server actions
components/           Site, candidate, admin, and shared UI components
comonents/            Existing legacy component directory
lib/auth/             Password, session, token, and authorization helpers
lib/db/               Database connection, schema, and migrations
lib/services/         Application services and database operations
scripts/              Database setup and local verification utilities
tests/                Workflow and authorization tests
public/               Static assets
docker-compose.yml    Local PostgreSQL service
.env.example          Safe environment template
```

`data/`, `storage/`, `node_modules/`, and `.next/` are local or generated directories and are not published. Migrations create users, sessions, password resets, categories, jobs, files, applications, application events, saved jobs, notifications, audit events, and settings.

## Current limitations

- Outbound email is not connected. Password-reset tokens are supported, but the application does not send reset emails. The development CLI can generate a reset link.
- Administrative privileges are stored in the database and enforced on the server. The seed script can create an initial administrator for development.
- Applications use the allowed Pending, Under Review, Accepted, Rejected, and Withdrawn transitions. Jobs with applications must be archived instead of deleted.

## GitHub publishing

Review the working tree before publishing, including any changes that predate repository preparation:

```powershell
git status --short
git diff --check
git diff
git check-ignore .env node_modules .next data storage
```

Stage only after reviewing the files; `.env.example` is the only environment file intended for Git. Keep the existing `.git` directory to preserve history. Configure the `wazifa` GitHub remote only after deciding whether to rename the existing GitHub repository or create a new empty one, then commit and push the intended branch. Never force-push or initialize a replacement repository to rename this project.
