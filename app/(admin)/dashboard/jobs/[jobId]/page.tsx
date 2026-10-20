
import Link from "next/link";

export const instant = false;

type Props = {
  params: Promise<{ jobId: string }>;
};

async function JobDetailsPage({ params }: Props) {
  const { jobId } = await params;

  console.log(jobId);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-4xl font-bold">Job Details</h1>

      <Link
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        href={`/dashboard/jobs/${jobId}/edit`}
      >
        Edit Job
      </Link>

      <Link
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        href="/dashboard/jobs"
      >
        Back to Jobs
      </Link>
    </div>
  );
}

export default JobDetailsPage;
