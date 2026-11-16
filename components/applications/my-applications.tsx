"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/jobs/status-badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/types";

const statuses: Array<ApplicationStatus | "All"> = ["All", "Pending", "Under Review", "Accepted", "Rejected", "Withdrawn"];

export type CandidateApplicationRow = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  submittedAt: string;
  status: ApplicationStatus;
};

export function MyApplications({ applications }: { applications: CandidateApplicationRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "All">("All");
  const rows = useMemo(() => {
    return applications.filter((application) => {
      const haystack = `${application.jobTitle} ${application.company}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesStatus = status === "All" || application.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [applications, query, status]);
  const summary = {
    total: applications.length,
    pending: applications.filter((item) => item.status === "Pending").length,
    review: applications.filter((item) => item.status === "Under Review").length,
    accepted: applications.filter((item) => item.status === "Accepted").length,
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Total", summary.total, "bg-electric"],
          ["Pending", summary.pending, "bg-white"],
          ["Review", summary.review, "bg-cobalt text-white"],
          ["Accepted", summary.accepted, "bg-ink text-white"],
        ].map(([label, value, color]) => (
          <div key={String(label)} className={`border-[3px] border-ink p-4 ${color}`}>
            <p className="text-xs font-extrabold tracking-widest uppercase">{label}</p>
            <p className="text-4xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-[3px] border-ink bg-white p-3">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or company" className="max-w-sm" />
        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`border-[2px] border-ink px-2 py-1 text-[10px] font-extrabold uppercase ${status === item ? "bg-ink text-white" : "bg-pale"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="border-[3px] border-ink bg-white p-8">
          <p className="text-2xl font-black">No applications yet.</p>
          <Link href="/jobs" className="mt-3 inline-block font-extrabold uppercase underline">Browse jobs</Link>
        </div>
      ) : (
        <div className="overflow-x-auto border-[3px] border-ink bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-pale text-xs font-extrabold tracking-widest uppercase">
              <tr>
                <th className="border-b-[3px] border-ink px-4 py-3">Job</th>
                <th className="border-b-[3px] border-ink px-4 py-3">Company</th>
                <th className="border-b-[3px] border-ink px-4 py-3">Submitted</th>
                <th className="border-b-[3px] border-ink px-4 py-3">Status</th>
                <th className="border-b-[3px] border-ink px-4 py-3"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((application) => (
                <tr key={application.id} className="odd:bg-white even:bg-paper">
                  <td className="border-b-[2px] border-ink px-4 py-4 font-black">{application.jobTitle}</td>
                  <td className="border-b-[2px] border-ink px-4 py-4">{application.company}</td>
                  <td className="border-b-[2px] border-ink px-4 py-4">{formatDate(application.submittedAt)}</td>
                  <td className="border-b-[2px] border-ink px-4 py-4"><StatusBadge status={application.status} /></td>
                  <td className="border-b-[2px] border-ink px-4 py-4">
                    <Link href={`/applications/${application.id}`} className="font-extrabold uppercase underline">Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
