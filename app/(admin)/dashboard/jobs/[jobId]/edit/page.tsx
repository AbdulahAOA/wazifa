import { Suspense } from "react";
import { notFound } from "next/navigation";
import { JobForm } from "@/components/admin/job-form";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { getAnyJob } from "@/lib/services/jobs";
import { listCategories } from "@/lib/services/settings";

type Props = { params: Promise<{ jobId: string }> };

export default function EditJobPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="font-black">Loading the editor…</p>}>
      <EditJob params={params} />
    </Suspense>
  );
}

async function EditJob({ params }: Props) {
  await liveRequest();
  const { jobId } = await params;
  const db = await getDb();
  const [result, categories] = await Promise.all([getAnyJob(db, jobId), listCategories(db)]);
  if (!result) notFound();

  return (
    <div className="grid gap-5">
      <div>
        <p className="section-kicker">Edit</p>
        <h1 className="text-4xl font-black">{result.job.title}</h1>
      </div>
      <JobForm job={result.job} categories={categories} />
    </div>
  );
}
