"use client";

import { useMemo, useState } from "react";
import { ApplicationRowActions } from "@/components/admin/application-row-actions";
import { StatusBadge } from "@/components/jobs/status-badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/types";
import type { ApplicationView } from "@/lib/services/applications";

const statuses: Array<ApplicationStatus | "All"> = [
  "All",
  "Pending",
  "Under Review",
  "Accepted",
  "Rejected",
  "Withdrawn",
];

export function ApplicationsBoard({ applications }: { applications: ApplicationView[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "All">("All");

  const rows = useMemo(() => {
    return applications.filter((application) => {
      const haystack = `${application.candidateName} ${application.jobTitle}`.toLowerCase();
      return (
        (!query || haystack.includes(query.toLowerCase())) &&
        (status === "All" || application.status === status)
      );
    });
  }, [applications, query, status]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3 border-[3px] border-ink bg-white p-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search candidate or role"
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`border-[2px] border-ink px-2 py-1 text-[10px] font-extrabold uppercase ${
                status === item ? "bg-ink text-white" : "bg-pale"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto border-[3px] border-ink bg-white">
        <table className="w-full min-w-[800px] text-left">
          <thead className="bg-pale text-[10px] font-extrabold tracking-widest uppercase">
            <tr>
              <th className="border-b-[3px] border-ink px-4 py-3">Candidate</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Role</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Submitted</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Status</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 font-bold" colSpan={5}>
                  No applications match these filters.
                </td>
              </tr>
            ) : (
              rows.map((application) => (
                <tr key={application.id} className="odd:bg-white even:bg-paper">
                  <td className="border-b-[2px] border-ink px-4 py-3 font-black">{application.candidateName}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{application.jobTitle}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{formatDate(application.submittedAt)}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="border-b-[2px] border-ink px-4 py-3">
                    <ApplicationRowActions
                      applicationId={application.id}
                      candidateName={application.candidateName}
                      jobTitle={application.jobTitle}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
