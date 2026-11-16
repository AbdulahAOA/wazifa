import { Suspense } from "react";
import { JobForm } from "@/components/admin/job-form";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { listCategories } from "@/lib/services/settings";

export default function NewJobPage() {
  return (
    <Suspense fallback={<p className="font-black">Loading the form…</p>}>
      <NewJobContent />
    </Suspense>
  );
}

async function NewJobContent() {
  await liveRequest();
  const categories = await listCategories(await getDb());

  return (
    <div className="grid gap-5">
      <div>
        <p className="section-kicker">Create</p>
        <h1 className="text-4xl font-black">NEW JOB.</h1>
      </div>
      <JobForm categories={categories} />
    </div>
  );
}
