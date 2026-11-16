import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { files } from "@/lib/db/schema";
import type { Database } from "@/lib/db/types";
import { fail, ok, type ServiceResult } from "@/lib/result";
import type { PublicUser } from "@/lib/types";
import { newId } from "@/lib/services/ids";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const kinds = {
  pdf: { ext: ".pdf", mime: "application/pdf" },
  doc: { ext: ".doc", mime: "application/msword" },
  docx: {
    ext: ".docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
} as const;

type ResumeKind = keyof typeof kinds;

export function detectResume(bytes: Buffer, filename: string): ResumeKind | null {
  const ext = path.extname(filename).toLowerCase();
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("utf8") === "%PDF-") {
    return ext === ".pdf" ? "pdf" : null;
  }
  if (bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    return ext === ".doc" ? "doc" : null;
  }
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return ext === ".docx" ? "docx" : null;
  }
  return null;
}

export async function storeResume(
  db: Database,
  input: { ownerUserId: string; filename: string; bytes: Buffer; storageDir: string },
): Promise<ServiceResult<{ id: string; storedName: string }>> {
  if (input.bytes.length === 0) return fail("validation", "Upload a resume file.");
  if (input.bytes.length > MAX_RESUME_BYTES) return fail("validation", "Resume must be 5MB or smaller.");
  const kind = detectResume(input.bytes, input.filename);
  if (!kind) return fail("validation", "Upload a PDF, DOC, or DOCX resume.");
  const id = newId();
  const storedName = `${id}${kinds[kind].ext}`;
  const directory = path.resolve(input.storageDir);
  const fullPath = path.resolve(directory, storedName);
  if (!fullPath.startsWith(directory + path.sep)) return fail("validation", "Could not store that file.");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(fullPath, input.bytes);
  try {
    await db.insert(files).values({
      id,
      ownerUserId: input.ownerUserId,
      originalName: path.basename(input.filename).slice(0, 180),
      storedName,
      mimeType: kinds[kind].mime,
      sizeBytes: input.bytes.length,
    });
  } catch (error) {
    await fs.unlink(fullPath).catch(() => undefined);
    throw error;
  }
  return ok({ id, storedName });
}

const avatarKinds = {
  jpeg: { ext: ".jpg", mime: "image/jpeg" },
  png: { ext: ".png", mime: "image/png" },
  webp: { ext: ".webp", mime: "image/webp" },
} as const;

type AvatarKind = keyof typeof avatarKinds;

export function detectAvatar(bytes: Buffer, filename: string): AvatarKind | null {
  const ext = path.extname(filename).toLowerCase();
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return ext === ".jpg" || ext === ".jpeg" ? "jpeg" : null;
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return ext === ".png" ? "png" : null;
  }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("utf8") === "RIFF" && bytes.subarray(8, 12).toString("utf8") === "WEBP") {
    return ext === ".webp" ? "webp" : null;
  }
  return null;
}

export async function storeAvatar(
  db: Database,
  input: { ownerUserId: string; filename: string; bytes: Buffer; storageDir: string },
): Promise<ServiceResult<{ id: string; storedName: string }>> {
  if (input.bytes.length === 0) return fail("validation", "Upload a profile photo.");
  if (input.bytes.length > MAX_AVATAR_BYTES) return fail("validation", "Profile photo must be 2MB or smaller.");
  const kind = detectAvatar(input.bytes, input.filename);
  if (!kind) return fail("validation", "Upload a JPG, PNG, or WebP photo.");
  const id = newId();
  const storedName = `${id}${avatarKinds[kind].ext}`;
  const directory = path.resolve(input.storageDir);
  const fullPath = path.resolve(directory, storedName);
  if (!fullPath.startsWith(directory + path.sep)) return fail("validation", "Could not store that file.");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(fullPath, input.bytes);
  try {
    await db.insert(files).values({
      id,
      ownerUserId: input.ownerUserId,
      originalName: path.basename(input.filename).slice(0, 180),
      storedName,
      mimeType: avatarKinds[kind].mime,
      sizeBytes: input.bytes.length,
    });
  } catch (error) {
    await fs.unlink(fullPath).catch(() => undefined);
    throw error;
  }
  return ok({ id, storedName });
}

export async function removeStoredFile(storageDir: string, storedName: string) {
  const directory = path.resolve(storageDir);
  const fullPath = path.resolve(directory, storedName);
  if (!fullPath.startsWith(directory + path.sep)) return;
  await fs.unlink(fullPath).catch(() => undefined);
}

export async function readAuthorizedFile(db: Database, user: PublicUser, fileId: string, storageDir: string) {
  const [file] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!file) return null;
  if (user.role !== "admin" && file.ownerUserId !== user.id) return null;
  const directory = path.resolve(storageDir);
  const fullPath = path.resolve(directory, file.storedName);
  if (!fullPath.startsWith(directory + path.sep)) return null;
  try {
    const bytes = await fs.readFile(fullPath);
    return { file, bytes };
  } catch {
    return null;
  }
}
