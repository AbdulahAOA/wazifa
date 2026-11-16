import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type AppEnv = {
  nodeEnv: string;
  isProd: boolean;
  databaseUrl: string | null;
  sessionSecret: string;
  uploadDir: string;
  cookieSecure: boolean;
};

let cached: AppEnv | null = null;

function loadDotEnv() {
  const file = path.join(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function devSessionSecret() {
  const file = path.join(process.cwd(), "data", "dev-session-secret");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, "utf8").trim();
    if (existing.length >= 32) return existing;
  }
  const secret = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(file, secret, { encoding: "utf8", mode: 0o600 });
  return secret;
}

export function loadEnv(): AppEnv {
  if (cached) return cached;
  loadDotEnv();
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProd = nodeEnv === "production";
  const building = process.env.NEXT_PHASE === "phase-production-build";
  const databaseUrl = process.env.DATABASE_URL?.trim() || null;
  if (isProd && !building && !databaseUrl) {
    throw new Error(
      "DATABASE_URL is required in production. Set it to a PostgreSQL connection string.",
    );
  }
  const configuredSecret = process.env.SESSION_SECRET?.trim() ?? "";
  if (configuredSecret && configuredSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }
  if (!configuredSecret && isProd && !building) {
    throw new Error(
      "SESSION_SECRET is required in production. Use a random string of at least 32 characters.",
    );
  }
  const sessionSecret = configuredSecret || devSessionSecret();
  const configuredUpload = process.env.UPLOAD_DIR?.trim();
  const uploadDir = configuredUpload
    ? path.resolve(/* turbopackIgnore: true */ configuredUpload)
    : path.join(process.cwd(), "storage", "private");
  const cookieSecure = process.env.COOKIE_SECURE === "true" || isProd;
  cached = { nodeEnv, isProd, databaseUrl, sessionSecret, uploadDir, cookieSecure };
  return cached;
}

export function resetEnvCache() {
  cached = null;
}
