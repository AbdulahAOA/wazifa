import { Suspense } from "react";
import { ApplicationsBoard } from "@/components/admin/applications-board";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { listAdminApplications } from "@/lib/services/applications";

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<p className="font-black">Loading the queue…</p>}>
      <ApplicationsContent />
    </Suspense>
  );
}

async function ApplicationsContent() {
  await liveRequest();
  const admin = await requireAdmin();
  const result = await listAdminApplications(await getDb(), admin, { pageSize: 50 });

  return (
    <div className="grid gap-5">
      <div>
        <p className="section-kicker">Queue</p>
        <h1 className="text-4xl font-black">APPLICATIONS.</h1>
      </div>
      <ApplicationsBoard applications={result.applications} />
    </div>
  );
}
