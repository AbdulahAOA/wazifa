import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/jobs/status-badge";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { getDashboard } from "@/lib/services/dashboard";

const tones: Record<string, string> = {
  Pending: "bg-electric",
  "Under Review": "bg-cobalt",
  Accepted: "bg-ink",
  Rejected: "bg-coral",
  Withdrawn: "bg-pale",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="font-black">Loading the desk…</p>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await liveRequest();
  const data = await getDashboard(await getDb(), "30d");
  const maxVolume = Math.max(...data.statusBreakdown.map((item) => item.count), 1);
  const cards: { label: string; value: string; tone: string; href?: string }[] = [
    { label: "Open jobs", value: String(data.publishedJobs), tone: "bg-electric" },
    { label: "Applications", value: String(data.applicationsInRange), tone: "bg-cobalt text-white" },
    { label: "Pending review", value: String(data.pendingApplications), tone: "bg-coral text-white" },
    { label: "Users", value: String(data.totalUsers), tone: "bg-ink text-white", href: "/dashboard/users" },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Overview</p>
          <h1 className="text-4xl font-black md:text-5xl">OPERATOR DESK.</h1>
        </div>
        <Button variant="cobalt" asChild>
          <Link href="/dashboard/jobs/new">New job</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`border-[3px] border-ink p-4 hard-shadow-sm ${card.tone}`}>
            <p className="text-xs font-extrabold tracking-widest uppercase">{card.label}</p>
            <p className="mt-2 text-5xl font-black">{card.value}</p>
            {card.href ? (
              <Link
                href={card.href}
                className="mt-3 inline-block border-[2px] border-ink bg-white px-2 py-1 text-[10px] font-extrabold tracking-widest uppercase text-ink"
              >
                View all users
              </Link>
            ) : null}
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="border-[3px] border-ink bg-white">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-pale px-4 py-3">
            <h2 className="font-black">Application volume</h2>
            <span className="text-xs font-extrabold tracking-widest uppercase">Last 30 days</span>
          </div>
          <div className="grid gap-4 p-5">
            {data.statusBreakdown.map((item) => (
              <div key={item.status} className="grid gap-2">
                <div className="flex items-center justify-between text-xs font-extrabold tracking-widest uppercase">
                  <span>{item.status}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-6 border-[3px] border-ink bg-pale">
                  <div
                    className={`h-full ${tones[item.status] ?? "bg-ink"}`}
                    style={{ width: `${item.count === 0 ? 0 : Math.max(8, (item.count / maxVolume) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="border-[3px] border-ink bg-ink p-5 text-white">
          <p className="section-kicker text-electric">Today</p>
          <h2 className="mt-2 text-3xl font-black">Review the pending pile first.</h2>
          <p className="mt-3 text-white/80">
            Featured listings convert faster when review SLA stays under 48 hours. Keep the queue moving.
          </p>
          <Button className="mt-6" variant="electric" asChild>
            <Link href="/dashboard/applications">Open applications</Link>
          </Button>
        </section>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="border-[3px] border-ink bg-white">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-pale px-4 py-3">
            <h2 className="font-black">Latest applications</h2>
            <Link href="/dashboard/applications" className="text-xs font-extrabold uppercase underline">
              Queue
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="text-[10px] font-extrabold tracking-widest uppercase">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentApplications.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 font-bold" colSpan={4}>
                      No applications in this range.
                    </td>
                  </tr>
                ) : (
                  data.recentApplications.map((application) => (
                    <tr key={application.id} className="border-t-[2px] border-ink">
                      <td className="px-4 py-3 font-black">
                        <Link href={`/dashboard/applications/${application.id}`} className="underline">
                          {application.candidateName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{application.jobTitle}</td>
                      <td className="px-4 py-3">{formatDate(application.submittedAt)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={application.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="border-[3px] border-ink bg-white">
          <div className="border-b-[3px] border-ink bg-pale px-4 py-3">
            <h2 className="font-black">Recent jobs</h2>
          </div>
          <div className="grid">
            {data.recentJobs.length === 0 ? (
              <p className="px-4 py-5 font-bold">No jobs created in this range.</p>
            ) : (
              data.recentJobs.map((job) => (
                <div key={job.id} className="border-b-[2px] border-ink px-4 py-4 last:border-b-0">
                  <p className="font-bold">
                    <Link href={`/dashboard/jobs/${job.id}`} className="underline">
                      {job.title}
                    </Link>
                  </p>
                  <p className="mt-1 text-[10px] font-extrabold tracking-widest uppercase">
                    {job.company} · {job.status} · {formatDate(job.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
