import { and, eq, isNull } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashToken, newToken } from "@/lib/auth/tokens";
import type { Database } from "@/lib/db/types";
import { passwordResetTokens, sessions, users } from "@/lib/db/schema";
import { fail, isUniqueViolation, ok, type ServiceResult } from "@/lib/result";
import type { ProfileEducationEntry, ProfileExperienceEntry, PublicUser, UserRole } from "@/lib/types";
import { normalizeEmail, type Credentials } from "@/lib/validation";
import { newId } from "@/lib/services/ids";

let dummyHash: Promise<string> | null = null;

function dummyPasswordHash() {
  dummyHash ??= hashPassword("not-a-real-password");
  return dummyHash;
}

export function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    phone: row.phone,
    headline: row.headline,
    location: row.location,
    bio: row.bio,
    avatarFileId: row.avatarFileId ?? null,
    skills: Array.isArray(row.skills) ? row.skills : [],
    experience: Array.isArray(row.experience) ? row.experience : [],
    education: Array.isArray(row.education) ? row.education : [],
    resumeFileId: row.resumeFileId,
  };
}

export async function registerUser(db: Database, input: Credentials): Promise<ServiceResult<PublicUser>> {
  const passwordHash = await hashPassword(input.password!);
  try {
    const [row] = await db
      .insert(users)
      .values({
        id: newId(),
        email: input.email,
        passwordHash,
        name: input.name!.trim(),
        role: "candidate",
        phone: "",
        headline: "",
        location: "",
        bio: "",
      })
      .returning();
    return ok(toPublicUser(row!));
  } catch (error) {
    if (isUniqueViolation(error)) return fail("duplicate", "An account with that email already exists.");
    throw error;
  }
}

export async function authenticate(
  db: Database,
  email: string,
  password: string,
  secret: string,
): Promise<ServiceResult<{ user: PublicUser; token: string }>> {
  const normalized = normalizeEmail(email);
  const [row] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  const hash = row?.passwordHash ?? (await dummyPasswordHash());
  const valid = await verifyPassword(password, hash);
  if (!row || !valid) return fail("unauthorized", "Invalid email or password.");
  if (row.deactivatedAt) return fail("unauthorized", "Invalid email or password.");
  const token = await createSession(db, row.id, secret);
  return ok({ user: toPublicUser(row), token });
}

export async function createSession(db: Database, userId: string, secret: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    id: newId(),
    userId,
    tokenHash: hashToken(token, secret),
    expiresAt,
  });
  return token;
}

export async function userFromSession(db: Database, token: string | undefined, secret: string) {
  if (!token) return null;
  const tokenHash = hashToken(token, secret);
  const [row] = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);
  if (!row) return null;
  if (row.session.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, row.session.id));
    return null;
  }
  if (row.user.deactivatedAt) {
    await db.delete(sessions).where(eq(sessions.id, row.session.id));
    return null;
  }
  return toPublicUser(row.user);
}

export async function destroySession(db: Database, token: string, secret: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token, secret)));
}

export async function destroyUserSessions(db: Database, userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function requestPasswordReset(db: Database, email: string, secret: string, exposeToken: boolean) {
  const normalized = normalizeEmail(email);
  const [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  if (!user) return { devResetUrl: null as string | null };
  const token = newToken();
  await db.insert(passwordResetTokens).values({
    id: newId(),
    userId: user.id,
    tokenHash: hashToken(token, secret),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  return { devResetUrl: exposeToken ? `/reset-password?token=${encodeURIComponent(token)}` : null };
}

export async function resetPassword(db: Database, token: string, password: string, secret: string): Promise<ServiceResult<PublicUser>> {
  if (password.length < 8 || password.length > 200 || password.trim().length === 0) {
    return fail("validation", "Password must be at least 8 characters.");
  }
  const tokenHash = hashToken(token, secret);
  return db.transaction(async (tx) => {
    const database = tx as unknown as Database;
    const [row] = await database
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);
    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      return fail("unauthorized", "This reset link is invalid or has expired.");
    }
    const passwordHash = await hashPassword(password);
    const [user] = await database
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, row.userId))
      .returning();
    await database
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, row.userId), isNull(passwordResetTokens.usedAt)));
    await database.delete(sessions).where(eq(sessions.userId, row.userId));
    return ok(toPublicUser(user!));
  });
}

export async function updateProfile(
  db: Database,
  actor: PublicUser,
  input: {
    name: string;
    phone: string;
    headline: string;
    location: string;
    bio: string;
    skills: string[];
    experience: ProfileExperienceEntry[];
    education: ProfileEducationEntry[];
  },
  files?: { resumeFileId?: string | null; avatarFileId?: string | null },
): Promise<ServiceResult<PublicUser>> {
  const [row] = await db
    .update(users)
    .set({
      name: input.name,
      phone: input.phone,
      headline: input.headline,
      location: input.location,
      bio: input.bio,
      skills: input.skills,
      experience: input.experience,
      education: input.education,
      ...(files?.resumeFileId ? { resumeFileId: files.resumeFileId } : {}),
      ...(files?.avatarFileId ? { avatarFileId: files.avatarFileId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, actor.id))
    .returning();
  if (!row) return fail("not_found", "Account not found.");
  return ok(toPublicUser(row));
}
