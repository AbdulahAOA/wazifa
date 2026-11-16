import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { HomeSearch } from "@/components/jobs/home-search";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { getHome } from "@/lib/services/dashboard";

export default function Home() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-3xl font-black">Loading the board…</div>}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await liveRequest();
  let home;
  try {
    home = await getHome(await getDb());
  } catch (error) {
    console.error("home:database", error);
  }
  if (!home) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <p className="border-[3px] border-ink bg-coral p-6 text-2xl font-black text-white">
          The job board could not be loaded. Try again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <section className="grid-surface border-b-[3px] border-ink">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="stamp bg-coral text-white">Live board</span>
            <span className="stamp bg-white">{home.settings.boardName}</span>
          </div>
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)]">
            <h1 className="max-w-5xl text-6xl leading-[0.82] font-black tracking-tight sm:text-7xl md:text-8xl lg:text-9xl">
              YOUR NEXT JOB STARTS HERE.
            </h1>
            <div className="relative">
              <div className="absolute -top-6 right-0 hidden rotate-6 border-[3px] border-ink bg-electric px-3 py-2 text-xs font-black tracking-widest uppercase md:block">
                Apply once. Track everything.
              </div>
              <p className="border-[3px] border-ink bg-white p-6 text-lg leading-7 hard-shadow">
                Wazifa is a high-contrast hiring marketplace. Search roles, apply in one pass, and watch status move
                from pending to offer — without the usual corporate fog.
              </p>
            </div>
          </div>
          <div className="mt-10">
            <HomeSearch />
          </div>
        </div>
      </section>

      {home.settings.showFeatured ? (
        <section className="border-b-[3px] border-ink bg-cobalt text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-kicker text-electric">Featured</p>
                <h2 className="mt-2 text-4xl font-black md:text-5xl">Roles worth opening first.</h2>
              </div>
              <Button variant="electric" asChild>
                <Link href="/jobs">
                  All jobs
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            {home.featured.length === 0 ? (
              <p className="border-[3px] border-white p-6 text-xl font-black">No featured roles are published right now.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-3 md:items-stretch">
                {home.featured.map((job, index) => (
                  <div key={job.id} className="flex h-full flex-col gap-2">
                    <p className="text-electric index-num">{String(index + 1).padStart(2, "0")}</p>
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Categories</p>
            <h2 className="mt-2 text-4xl font-black md:text-5xl">Pick a lane.</h2>
          </div>
          <p className="max-w-sm text-sm font-medium">Six bold blocks. Each one is a filter, not a decoration.</p>
        </div>
        {home.categories.length === 0 ? (
          <p className="mt-6 border-[3px] border-ink bg-white p-5 font-bold">
            Categories show up after an operator adds them.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {home.categories.map((category) => (
              <Link
                key={category.id}
                href={`/jobs?category=${encodeURIComponent(category.name)}`}
                className={`flex min-h-36 items-end justify-between border-[3px] border-ink p-5 text-ink transition-all hard-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#111111] ${category.color}`}
              >
                <div>
                  <p className="text-4xl font-black leading-none">{category.name}</p>
                  <p className="mt-2 text-sm font-extrabold tracking-widest uppercase">{category.count} open</p>
                </div>
                <ArrowRight className="size-8 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-y-[3px] border-ink bg-pale">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
          <p className="section-kicker">Fresh</p>
          <h2 className="mt-2 text-4xl font-black md:text-5xl">Recently posted.</h2>
          {home.recent.length === 0 ? (
            <p className="mt-6 border-[3px] border-ink bg-white p-5 font-bold">No published roles yet.</p>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {home.recent.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <p className="section-kicker">Signal</p>
        <h2 className="mt-2 text-4xl font-black md:text-5xl">Hiring, in numbers.</h2>
        <div className="mt-8 grid border-[3px] border-ink sm:grid-cols-2 lg:grid-cols-4">
          {home.stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`border-ink p-6 ${index > 0 ? "border-t-[3px] sm:border-t-0 sm:border-l-[3px]" : ""} ${
                index === 2 ? "sm:border-t-[3px] lg:border-t-0" : ""
              } ${index === 0 ? "bg-electric" : index === 1 ? "bg-ink text-white" : index === 2 ? "bg-coral text-white" : "bg-white"}`}
            >
              <p className="text-6xl font-black tracking-tight md:text-7xl">{stat.value}</p>
              <p className="mt-2 text-xs font-extrabold tracking-[0.18em] uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t-[3px] border-ink bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-16 md:flex-row md:items-end md:px-6">
          <div>
            <p className="section-kicker text-electric">Apply</p>
            <h2 className="mt-3 max-w-3xl text-5xl leading-[0.95] font-black md:text-6xl">
              Stop scrolling generic boards. Start a real application.
            </h2>
          </div>
          <Button variant="electric" size="lg" asChild>
            <Link href="/jobs">
              Explore opportunities
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
