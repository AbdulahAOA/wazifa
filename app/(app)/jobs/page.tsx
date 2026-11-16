import { Suspense } from "react";
import { JobsListing, type JobsFilter } from "@/components/jobs/jobs-listing";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { first, pageNumber } from "@/lib/query";
import { savedJobIdsForUser, searchJobs } from "@/lib/services/jobs";
import { listCategories } from "@/lib/services/settings";
import type { EmploymentType, ExperienceLevel } from "@/lib/types";

export const metadata = { title: "Jobs" };

const employment = ["Full-time", "Part-time", "Contract", "Internship"];
const levels = ["Junior", "Mid", "Senior", "Lead"];
const sorts = ["newest", "salary", "title"];

type Search = Record<string, string | string[] | undefined>;

export default function JobsPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8 grid gap-4 border-[3px] border-ink bg-ink p-6 text-white md:grid-cols-[1.4fr_0.8fr] md:items-end">
        <div>
          <p className="section-kicker text-electric">Directory</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight md:text-7xl">OPEN ROLES.</h1>
        </div>
        <p className="text-white/80">
          Filter hard. The listing is a grid, not a feed. Every card carries salary, type, and location up front.
        </p>
      </div>
      <div>
        <Suspense fallback={<div className="border-[3px] border-ink bg-white p-10 font-black">Loading roles…</div>}>
          <JobsResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function JobsResults({ searchParams }: { searchParams: Promise<Search> }) {
  await liveRequest();
  const params = await searchParams;
  const type = first(params.type);
  const level = first(params.level);
  const sort = first(params.sort);
  const salary = Number.parseInt(first(params.salary), 10);
  const filter: JobsFilter = {
    q: first(params.q),
    location: first(params.location),
    category: first(params.category) || "All",
    salary: Number.isFinite(salary) ? Math.min(Math.max(salary, 0), 100000) : 0,
    type: employment.includes(type) ? (type as EmploymentType) : "All",
    level: levels.includes(level) ? (level as ExperienceLevel) : "All",
    remote: first(params.remote) === "1",
    sort: sorts.includes(sort) ? (sort as JobsFilter["sort"]) : "newest",
    page: pageNumber(params.page),
  };
  let result: Awaited<ReturnType<typeof searchJobs>> | null = null;
  let categories: string[] = [];
  let savedIds = new Set<string>();
  let user = null;
  try {
    const db = await getDb();
    user = await getCurrentUser();
    const [found, listed] = await Promise.all([
      searchJobs(db, {
        visibility: "public",
        q: filter.q,
        location: filter.location,
        category: filter.category,
        salaryMin: filter.salary,
        employmentType: filter.type,
        experienceLevel: filter.level,
        remote: filter.remote,
        sort: filter.sort,
        page: filter.page,
        pageSize: 6,
      }),
      listCategories(db),
    ]);
    result = found;
    categories = listed.map((category) => category.name);
    if (user) savedIds = await savedJobIdsForUser(db, user.id);
  } catch (error) {
    console.error("jobs:database", error);
  }
  if (!result) {
    return (
      <p className="border-[3px] border-ink bg-coral p-6 text-xl font-black text-white">
        Jobs could not be loaded. Try again in a moment.
      </p>
    );
  }

  return (
    <JobsListing
      jobs={result.jobs}
      total={result.total}
      pageSize={result.pageSize}
      filter={{ ...filter, page: result.page }}
      categories={categories}
      savedJobIds={savedIds}
      showSave={Boolean(user)}
    />
  );
}
