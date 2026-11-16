"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmploymentType, ExperienceLevel, Job } from "@/lib/types";

export type JobsFilter = {
  q: string;
  location: string;
  category: string;
  salary: number;
  type: EmploymentType | "All";
  level: ExperienceLevel | "All";
  remote: boolean;
  sort: "newest" | "salary" | "title";
  page: number;
};

export function JobsListing({
  jobs,
  total,
  pageSize,
  filter,
  categories,
  savedJobIds,
  showSave,
}: {
  jobs: Job[];
  total: number;
  pageSize: number;
  filter: JobsFilter;
  categories: string[];
  savedJobIds?: Set<string>;
  showSave?: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState({ q: filter.q, location: filter.location });
  const committed = useRef({ q: filter.q, location: filter.location });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = draft.q;
  const location = draft.location;

  useEffect(() => {
    if (filter.q === committed.current.q && filter.location === committed.current.location) return;
    const fromBrowser = draft.q === committed.current.q && draft.location === committed.current.location;
    committed.current = { q: filter.q, location: filter.location };
    if (fromBrowser) setDraft({ q: filter.q, location: filter.location });
  }, [draft.location, draft.q, filter.location, filter.q]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(filter.page, pages);

  function hrefFor(next: JobsFilter) {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.location) params.set("location", next.location);
    if (next.category !== "All") params.set("category", next.category);
    if (next.salary) params.set("salary", String(next.salary));
    if (next.type !== "All") params.set("type", next.type);
    if (next.level !== "All") params.set("level", next.level);
    if (next.remote) params.set("remote", "1");
    if (next.sort !== "newest") params.set("sort", next.sort);
    if (next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  }

  function push(patch: Partial<JobsFilter>, resetPage = true) {
    const next: JobsFilter = {
      ...filter,
      ...patch,
      q: patch.q ?? query,
      location: patch.location ?? location,
      page: patch.page ?? (resetPage ? 1 : filter.page),
    };
    router.replace(hrefFor(next), { scroll: false });
  }

  useEffect(() => {
    if (draft.q === filter.q && draft.location === filter.location) return;
    const handle = window.setTimeout(() => {
      committed.current = { q: draft.q, location: draft.location };
      const next: JobsFilter = { ...filter, q: draft.q, location: draft.location, page: 1 };
      router.replace(hrefFor(next), { scroll: false });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [draft.q, draft.location, filter, router]);

  const filters = (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="job-query">Search</Label>
        <Input
          id="job-query"
          value={query}
          onChange={(event) => setDraft({ q: event.target.value, location })}
          placeholder="Title, company, or description"
        />
      </div>
      <FilterGroup label="Category">
        {["All", ...categories].map((item) => (
          <FilterChip key={item} active={filter.category === item} onClick={() => push({ category: item })}>
            {item}
          </FilterChip>
        ))}
      </FilterGroup>
      <div className="grid gap-2">
        <Label htmlFor="job-location">Location</Label>
        <Input
          id="job-location"
          value={location}
          onChange={(event) => setDraft({ q: query, location: event.target.value })}
          placeholder="City or remote"
        />
      </div>
      <div className="grid gap-2">
        <Label>Minimum salary ({filter.salary ? `$${filter.salary / 1000}k` : "Any"})</Label>
        <input
          type="range"
          min={0}
          max={100000}
          step={10000}
          value={filter.salary}
          onChange={(event) => push({ salary: Number(event.target.value) })}
          className="accent-cobalt"
        />
      </div>
      <FilterGroup label="Employment type">
        {(["All", "Full-time", "Part-time", "Contract", "Internship"] as const).map((item) => (
          <FilterChip key={item} active={filter.type === item} onClick={() => push({ type: item })}>
            {item}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup label="Experience">
        {(["All", "Junior", "Mid", "Senior", "Lead"] as const).map((item) => (
          <FilterChip key={item} active={filter.level === item} onClick={() => push({ level: item })}>
            {item}
          </FilterChip>
        ))}
      </FilterGroup>
      <label className="flex items-center gap-2 border-[3px] border-ink bg-white px-3 py-3 text-xs font-extrabold tracking-widest uppercase">
        <input
          type="checkbox"
          checked={filter.remote}
          onChange={(event) => push({ remote: event.target.checked })}
          className="size-4 accent-ink"
        />
        Remote only
      </label>
      <Button variant="outline" onClick={() => { setDraft({ q: "", location: "" }); router.push("/jobs"); setFiltersOpen(false); }}>
        <X className="size-4" />
        Clear filters
      </Button>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-[3px] border-ink bg-pale p-4 lg:block">{filters}</aside>
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-white p-3">
          <p className="font-black">{total} roles</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal />
              Filters
            </Button>
            <Label htmlFor="sort" className="sr-only">Sort</Label>
            <select
              id="sort"
              value={filter.sort}
              onChange={(event) => push({ sort: event.target.value as JobsFilter["sort"] }, false)}
              className="h-10 border-[3px] border-ink bg-electric px-2 text-xs font-extrabold uppercase"
            >
              <option value="newest">Newest</option>
              <option value="salary">Salary</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
        {jobs.length === 0 ? (
          <div className="border-[3px] border-ink bg-white p-10 text-center hard-shadow">
            <p className="text-2xl font-black">No matching roles.</p>
            <p className="mt-2">Clear filters and try a broader search.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} showSave={showSave} saved={savedJobIds?.has(job.id)} />
            ))}
          </div>
        )}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={current === 1} onClick={() => push({ page: current - 1 }, false)}>
            Prev
          </Button>
          <span className="border-[3px] border-ink bg-electric px-3 py-2 text-sm font-black">
            {current} / {pages}
          </span>
          <Button variant="outline" size="sm" disabled={current === pages} onClick={() => push({ page: current + 1 }, false)}>
            Next
          </Button>
        </div>
      </div>
      {filtersOpen ? (
        <div className="fixed inset-0 z-50 bg-ink/50 p-4 lg:hidden">
          <div className="ml-auto h-full max-w-sm overflow-auto border-[3px] border-ink bg-paper p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-black">Filters</p>
              <Button size="icon" variant="outline" onClick={() => setFiltersOpen(false)}>
                <X />
              </Button>
            </div>
            {filters}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-[2px] border-ink px-2 py-1 text-[10px] font-extrabold tracking-widest uppercase ${active ? "bg-ink text-white" : "bg-white"}`}
    >
      {children}
    </button>
  );
}
