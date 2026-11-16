import { and, count, desc, eq, gte, ne } from "drizzle-orm";
import { applications, jobs, users } from "@/lib/db/schema";
import type { Database } from "@/lib/db/types";
import { asDate, formatDuration } from "@/lib/format";
import { statusBreakdown } from "@/lib/services/applications";
import { medianReviewHours, searchJobs } from "@/lib/services/jobs";
import { listCategories, getSettings } from "@/lib/services/settings";
import type { ApplicationStatus, JobStatus, PublicUser } from "@/lib/types";

export type DashboardRange = "7d" | "30d" | "90d" | "all";

export function rangeStart(range: DashboardRange) {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function getDashboard(db: Database, range: DashboardRange) {
  const since = rangeStart(range);
  const [publishedRow] = await db.select({ value: count() }).from(jobs).where(eq(jobs.status, "published"));
  const [totalJobsRow] = await db.select({ value: count() }).from(jobs).where(ne(jobs.status, "archived"));
  const [candidatesRow] = await db.select({ value: count() }).from(users).where(eq(users.role, "candidate"));
  const [usersRow] = await db.select({ value: count() }).from(users);
  const [pendingRow] = await db
    .select({ value: count() })
    .from(applications)
    .where(and(eq(applications.status, "Pending"), since ? gte(applications.submittedAt, since) : undefined));
  const [applicationsRow] = await db
    .select({ value: count() })
    .from(applications)
    .where(since ? gte(applications.submittedAt, since) : undefined);
  const breakdown = await statusBreakdown(db, since);
  const recentApplications = await db
    .select({
      id: applications.id,
      candidateName: applications.candidateName,
      submittedAt: applications.submittedAt,
      status: applications.status,
      jobTitle: jobs.title,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(since ? gte(applications.submittedAt, since) : undefined)
    .orderBy(desc(applications.submittedAt))
    .limit(8);
  const recentJobs = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      status: jobs.status,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .where(since ? gte(jobs.createdAt, since) : undefined)
    .orderBy(desc(jobs.createdAt))
    .limit(5);

  const statuses: ApplicationStatus[] = ["Pending", "Under Review", "Accepted", "Rejected", "Withdrawn"];
  return {
    range,
    publishedJobs: Number(publishedRow?.value ?? 0),
    totalJobs: Number(totalJobsRow?.value ?? 0),
    totalCandidates: Number(candidatesRow?.value ?? 0),
    totalUsers: Number(usersRow?.value ?? 0),
    pendingApplications: Number(pendingRow?.value ?? 0),
    applicationsInRange: Number(applicationsRow?.value ?? 0),
    statusBreakdown: statuses.map((status) => ({
      status,
      count: breakdown.find((item) => item.status === status)?.count ?? 0,
    })),
    recentApplications: recentApplications.map((row) => ({
      id: row.id,
      candidateName: row.candidateName,
      jobTitle: row.jobTitle,
      submittedAt: asDate(row.submittedAt).toISOString(),
      status: row.status as ApplicationStatus,
    })),
    recentJobs: recentJobs.map((row) => ({
      id: row.id,
      title: row.title,
      company: row.company,
      status: row.status as JobStatus,
      createdAt: asDate(row.createdAt).toISOString(),
    })),
  };
}

export async function getHome(db: Database) {
  const settings = await getSettings(db);
  const categories = await listCategories(db);
  const featured = settings.showFeatured
    ? await searchJobs(db, { visibility: "public", featured: true, sort: "newest", pageSize: 3 })
    : { jobs: [], total: 0, page: 1, pageSize: 3 };
  const recent = await searchJobs(db, { visibility: "public", sort: "newest", pageSize: 4 });
  const [openRoles] = await db.select({ value: count() }).from(jobs).where(eq(jobs.status, "published"));
  const companies = await db.selectDistinct({ company: jobs.company }).from(jobs).where(eq(jobs.status, "published"));
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [monthApplications] = await db
    .select({ value: count() })
    .from(applications)
    .where(gte(applications.submittedAt, monthStart));
  const median = await medianReviewHours(db);
  return {
    settings,
    categories,
    featured: featured.jobs,
    recent: recent.jobs,
    stats: [
      { label: "Open roles", value: String(Number(openRoles?.value ?? 0)) },
      { label: "Companies hiring", value: String(companies.length) },
      { label: "Applications this month", value: String(Number(monthApplications?.value ?? 0)) },
      { label: "Median time to review", value: formatDuration(median) },
    ],
  };
}

export async function adminSearch(db: Database, actor: PublicUser, q: string) {
  if (actor.role !== "admin") {
    return { jobs: [], applications: [] };
  }
  const jobsResult = await searchJobs(db, { visibility: "admin", q, pageSize: 8 });
  const { listAdminApplications } = await import("@/lib/services/applications");
  const applicationsResult = await listAdminApplications(db, actor, { q, pageSize: 8 });
  return { jobs: jobsResult.jobs, applications: applicationsResult.applications };
}
