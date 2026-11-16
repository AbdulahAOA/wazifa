import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { ProfileEducationEntry, ProfileExperienceEntry } from "@/lib/types";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  phone: text("phone").notNull().default(""),
  headline: text("headline").notNull().default(""),
  location: text("location").notNull().default(""),
  bio: text("bio").notNull().default(""),
  avatarFileId: text("avatar_file_id"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  experience: jsonb("experience").$type<ProfileExperienceEntry[]>().notNull().default([]),
  education: jsonb("education").$type<ProfileEducationEntry[]>().notNull().default([]),
  resumeFileId: text("resume_file_id"),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const jobCategories = pgTable("job_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  companyTag: text("company_tag").notNull(),
  location: text("location").notNull(),
  salaryLabel: text("salary_label").notNull(),
  salaryMin: integer("salary_min").notNull().default(0),
  salaryMax: integer("salary_max"),
  employmentType: text("employment_type").notNull(),
  experienceLevel: text("experience_level").notNull(),
  remote: boolean("remote").notNull().default(false),
  categoryId: text("category_id").notNull(),
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull(),
  description: text("description").notNull(),
  responsibilities: jsonb("responsibilities").$type<string[]>().notNull(),
  requirements: jsonb("requirements").$type<string[]>().notNull(),
  skills: jsonb("skills").$type<string[]>().notNull(),
  benefits: jsonb("benefits").$type<string[]>().notNull(),
  seeded: boolean("seeded").notNull().default(false),
  createdBy: text("created_by"),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
  closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id"),
  originalName: text("original_name").notNull(),
  storedName: text("stored_name").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull(),
  candidateUserId: text("candidate_user_id").notNull(),
  candidateName: text("candidate_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  coverLetter: text("cover_letter").notNull(),
  details: text("details").notNull().default(""),
  resumeFileId: text("resume_file_id"),
  status: text("status").notNull(),
  notes: text("notes").notNull().default(""),
  seeded: boolean("seeded").notNull().default(false),
  submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const applicationEvents = pgTable("application_events", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull(),
  actorUserId: text("actor_user_id"),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const savedJobs = pgTable("saved_jobs", {
  userId: text("user_id").notNull(),
  jobId: text("job_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href").notNull().default(""),
  readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, string>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
