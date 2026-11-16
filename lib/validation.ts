import type { EmploymentType, ExperienceLevel, JobStatus } from "@/lib/types";
import { fail, ok, type ServiceResult } from "@/lib/result";

const employment = new Set<EmploymentType>(["Full-time", "Part-time", "Contract", "Internship"]);
const experience = new Set<ExperienceLevel>(["Junior", "Mid", "Senior", "Lead"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30)
    .map((line) => line.slice(0, 240));
}

export type Credentials = {
  email: string;
  password: string;
  name?: string;
};

export function parseCredentials(input: { email?: string; password?: string; name?: string }, mode: "sign-in" | "sign-up"): ServiceResult<Credentials> {
  const email = normalizeEmail(input.email ?? "");
  const password = input.password ?? "";
  const name = (input.name ?? "").trim().replace(/\s+/g, " ");
  if (!emailPattern.test(email) || email.length > 254) return fail("validation", "Enter a valid email.");
  if (password.length < 8 || password.length > 200 || password.trim().length === 0) {
    return fail("validation", "Password must be at least 8 characters.");
  }
  if (mode === "sign-up" && (name.length < 2 || name.length > 80)) {
    return fail("validation", "Enter your name.");
  }
  return ok({ email, password, name });
}

export type JobInput = {
  title: string;
  company: string;
  location: string;
  salaryLabel: string;
  salaryMin: number;
  salaryMax: number | null;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  remote: boolean;
  categoryId: string;
  featured: boolean;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
  publish: boolean;
};

export function parseJobInput(input: Record<string, string | undefined>): ServiceResult<JobInput> {
  const title = (input.title ?? "").trim();
  const company = (input.company ?? "").trim();
  const location = (input.location ?? "").trim();
  const description = (input.description ?? "").trim();
  const categoryId = (input.categoryId ?? "").trim();
  const employmentType = input.employmentType as EmploymentType;
  const experienceLevel = input.experienceLevel as ExperienceLevel;
  const salaryMin = Number.parseInt(input.salaryMin ?? "", 10);
  const salaryMaxRaw = (input.salaryMax ?? "").trim();
  const salaryMax = salaryMaxRaw ? Number.parseInt(salaryMaxRaw, 10) : null;
  let salaryLabel = (input.salaryLabel ?? "").trim();

  if (title.length < 3 || title.length > 120) return fail("validation", "Title must be between 3 and 120 characters.");
  if (company.length < 2 || company.length > 120) return fail("validation", "Company is required.");
  if (location.length < 2 || location.length > 120) return fail("validation", "Location is required.");
  if (!categoryId) return fail("validation", "Choose a category.");
  if (!employment.has(employmentType)) return fail("validation", "Choose a valid employment type.");
  if (!experience.has(experienceLevel)) return fail("validation", "Choose a valid experience level.");
  if (!Number.isInteger(salaryMin) || salaryMin < 0 || salaryMin > 10_000_000) {
    return fail("validation", "Enter a minimum salary of 0 or more.");
  }
  if (salaryMax !== null && (!Number.isInteger(salaryMax) || salaryMax < salaryMin)) {
    return fail("validation", "Maximum salary must be at least the minimum.");
  }
  if (!salaryLabel) {
    salaryLabel = salaryMax ? `$${salaryMin.toLocaleString("en-US")} – $${salaryMax.toLocaleString("en-US")}` : `From $${salaryMin.toLocaleString("en-US")}`;
  }
  if (salaryLabel.length > 80) return fail("validation", "Salary label is too long.");
  if (description.length < 20 || description.length > 8000) {
    return fail("validation", "Description must be at least 20 characters.");
  }

  return ok({
    title,
    company,
    location,
    salaryLabel,
    salaryMin,
    salaryMax,
    employmentType,
    experienceLevel,
    remote: input.remote === "true" || input.remote === "on",
    categoryId,
    featured: input.featured === "true" || input.featured === "on",
    description,
    responsibilities: parseLines(input.responsibilities ?? ""),
    requirements: parseLines(input.requirements ?? ""),
    skills: parseLines(input.skills ?? ""),
    benefits: parseLines(input.benefits ?? ""),
    publish: input.intent !== "draft",
  });
}

export function parseApplicationInput(input: {
  jobId?: string;
  phone?: string;
  coverLetter?: string;
  details?: string;
}) {
  const jobId = (input.jobId ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const coverLetter = (input.coverLetter ?? "").trim();
  const details = (input.details ?? "").trim();
  if (!jobId) return fail("validation", "Missing job.");
  if (phone && phone.replace(/\D/g, "").length < 8) return fail("validation", "Enter a complete phone number.");
  if (phone.length > 40) return fail("validation", "Phone number is too long.");
  if (coverLetter.length < 40 || coverLetter.length > 5000) {
    return fail("validation", "Write at least 40 characters in the cover letter.");
  }
  if (details.length > 2000) return fail("validation", "Additional details are too long.");
  return ok({ jobId, phone, coverLetter, details });
}

function parseSkillsBlock(raw: string | undefined) {
  const skills = (raw ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const unique = [...new Set(skills)];
  if (unique.length > 40) return fail("validation", "List up to 40 skills.");
  for (const skill of unique) {
    if (skill.length > 60) return fail("validation", "Each skill must be 60 characters or fewer.");
  }
  return ok(unique);
}

function parseExperienceSlots(input: Record<string, string | undefined>) {
  const entries = [];
  for (let index = 0; index < 5; index += 1) {
    const title = (input[`experience_title_${index}`] ?? "").trim();
    const company = (input[`experience_company_${index}`] ?? "").trim();
    const period = (input[`experience_period_${index}`] ?? "").trim();
    const summary = (input[`experience_summary_${index}`] ?? "").trim();
    if (!title && !company && !period && !summary) continue;
    if (!title || !company) return fail("validation", "Each experience entry needs a title and company.");
    if (title.length > 120 || company.length > 120) return fail("validation", "Experience title or company is too long.");
    if (period.length > 80) return fail("validation", "Experience period is too long.");
    if (summary.length > 600) return fail("validation", "Experience summary is too long.");
    entries.push({ title, company, period, summary });
  }
  return ok(entries);
}

function parseEducationSlots(input: Record<string, string | undefined>) {
  const entries = [];
  for (let index = 0; index < 5; index += 1) {
    const school = (input[`education_school_${index}`] ?? "").trim();
    const degree = (input[`education_degree_${index}`] ?? "").trim();
    const year = (input[`education_year_${index}`] ?? "").trim();
    if (!school && !degree && !year) continue;
    if (!school || !degree) return fail("validation", "Each education entry needs a school and degree.");
    if (school.length > 120 || degree.length > 120) return fail("validation", "Education school or degree is too long.");
    if (year.length > 40) return fail("validation", "Education year is too long.");
    entries.push({ school, degree, year });
  }
  return ok(entries);
}

export function parseProfileInput(input: Record<string, string | undefined>) {
  const name = (input.name ?? "").trim().replace(/\s+/g, " ");
  const phone = (input.phone ?? "").trim();
  const headline = (input.headline ?? "").trim();
  const location = (input.location ?? "").trim();
  const bio = (input.bio ?? "").trim();
  if (name.length < 2 || name.length > 80) return fail("validation", "Enter your name.");
  if (phone && phone.replace(/\D/g, "").length < 8) return fail("validation", "Enter a complete phone number.");
  if (phone.length > 40) return fail("validation", "Phone number is too long.");
  if (headline.length > 120) return fail("validation", "Headline is too long.");
  if (location.length > 120) return fail("validation", "Location is too long.");
  if (bio.length > 2000) return fail("validation", "Bio is too long.");
  const skills = parseSkillsBlock(input.skills);
  if (!skills.ok) return skills;
  const experience = parseExperienceSlots(input);
  if (!experience.ok) return experience;
  const education = parseEducationSlots(input);
  if (!education.ok) return education;
  return ok({
    name,
    phone,
    headline,
    location,
    bio,
    skills: skills.data,
    experience: experience.data,
    education: education.data,
  });
}

export function safeNext(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return fallback;
  return value;
}

const jobStatuses = new Set<JobStatus>(["draft", "published", "closed", "archived"]);

export function parseJobStatus(value: string | undefined): JobStatus | null {
  if (!value || !jobStatuses.has(value as JobStatus)) return null;
  return value as JobStatus;
}

export function formRecord(formData: FormData) {
  const record: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") record[key] = value;
  }
  return record;
}
