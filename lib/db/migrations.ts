export type MigrationBundle = {
  id: string;
  statements: string[];
};

const INIT_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('candidate', 'admin')),
    phone text NOT NULL DEFAULT '',
    headline text NOT NULL DEFAULT '',
    location text NOT NULL DEFAULT '',
    bio text NOT NULL DEFAULT '',
    resume_file_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS job_categories (
    id text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    color text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS jobs (
    id text PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    company text NOT NULL,
    company_tag text NOT NULL,
    location text NOT NULL,
    salary_label text NOT NULL,
    salary_min integer NOT NULL DEFAULT 0 CHECK (salary_min >= 0),
    salary_max integer CHECK (salary_max IS NULL OR salary_max >= 0),
    employment_type text NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
    experience_level text NOT NULL CHECK (experience_level IN ('Junior', 'Mid', 'Senior', 'Lead')),
    remote boolean NOT NULL DEFAULT false,
    category_id text NOT NULL REFERENCES job_categories(id),
    featured boolean NOT NULL DEFAULT false,
    status text NOT NULL CHECK (status IN ('draft', 'published', 'closed', 'archived')),
    description text NOT NULL,
    responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
    requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
    skills jsonb NOT NULL DEFAULT '[]'::jsonb,
    benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
    seeded boolean NOT NULL DEFAULT false,
    created_by text REFERENCES users(id) ON DELETE SET NULL,
    published_at timestamptz,
    closed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status)`,
  `CREATE INDEX IF NOT EXISTS jobs_category_idx ON jobs (category_id)`,
  `CREATE INDEX IF NOT EXISTS jobs_published_at_idx ON jobs (published_at)`,
  `CREATE TABLE IF NOT EXISTS files (
    id text PRIMARY KEY,
    owner_user_id text REFERENCES users(id) ON DELETE SET NULL,
    original_name text NOT NULL,
    stored_name text NOT NULL UNIQUE,
    mime_type text NOT NULL,
    size_bytes integer NOT NULL CHECK (size_bytes >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS files_owner_idx ON files (owner_user_id)`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_resume_file_fk') THEN
      ALTER TABLE users
        ADD CONSTRAINT users_resume_file_fk
        FOREIGN KEY (resume_file_id) REFERENCES files (id) ON DELETE SET NULL;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS applications (
    id text PRIMARY KEY,
    job_id text NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    candidate_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    candidate_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL DEFAULT '',
    cover_letter text NOT NULL,
    details text NOT NULL DEFAULT '',
    resume_file_id text REFERENCES files(id) ON DELETE SET NULL,
    status text NOT NULL CHECK (status IN ('Pending', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn')),
    notes text NOT NULL DEFAULT '',
    seeded boolean NOT NULL DEFAULT false,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS applications_one_active
    ON applications (job_id, candidate_user_id)
    WHERE status <> 'Withdrawn'`,
  `CREATE INDEX IF NOT EXISTS applications_job_idx ON applications (job_id)`,
  `CREATE INDEX IF NOT EXISTS applications_candidate_idx ON applications (candidate_user_id)`,
  `CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status)`,
  `CREATE INDEX IF NOT EXISTS applications_submitted_idx ON applications (submitted_at)`,
  `CREATE TABLE IF NOT EXISTS application_events (
    id text PRIMARY KEY,
    application_id text NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
    from_status text,
    to_status text NOT NULL,
    note text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS application_events_app_idx ON application_events (application_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, job_id)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    href text NOT NULL DEFAULT '',
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications (user_id) WHERE read_at IS NULL`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id text PRIMARY KEY,
    actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events (entity_type, entity_id)`,
  `CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `INSERT INTO settings (key, value) VALUES
    ('board_name', 'Wazifa'),
    ('public_domain', 'wazifa.app'),
    ('admin_domain', 'admin.wazifa.app'),
    ('show_featured', 'true')
   ON CONFLICT (key) DO NOTHING`,
  `INSERT INTO schema_migrations (id) VALUES ('0001_init') ON CONFLICT (id) DO NOTHING`,
];

const PROFILE_STATEMENTS = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_file_id text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS skills jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS experience jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS education jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_avatar_file_fk') THEN
      ALTER TABLE users
        ADD CONSTRAINT users_avatar_file_fk
        FOREIGN KEY (avatar_file_id) REFERENCES files (id) ON DELETE SET NULL;
    END IF;
  END $$`,
  `INSERT INTO schema_migrations (id) VALUES ('0002_profile') ON CONFLICT (id) DO NOTHING`,
];

const USER_LIFECYCLE_STATEMENTS = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at timestamptz`,
  `INSERT INTO schema_migrations (id) VALUES ('0003_user_lifecycle') ON CONFLICT (id) DO NOTHING`,
];

export const MIGRATIONS: MigrationBundle[] = [
  { id: "0001_init", statements: INIT_STATEMENTS },
  { id: "0002_profile", statements: PROFILE_STATEMENTS },
  { id: "0003_user_lifecycle", statements: USER_LIFECYCLE_STATEMENTS },
];

/** @deprecated Use MIGRATIONS */
export const MIGRATION_ID = MIGRATIONS[0].id;
export const MIGRATION_STATEMENTS = MIGRATIONS.flatMap((bundle) => bundle.statements);
