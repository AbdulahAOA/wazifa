
import Link from "next/link";

export const instant = false;

type Props = {
  params: Promise<{ jobId: string }>;
};

async function EditJobPage({ params }: Props) {
  const { jobId } = await params;

  console.log(jobId);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-4xl font-bold">Edit Job</h1>

      <p>Editing job: {jobId}</p>

      <Link
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        href={`/dashboard/jobs/${jobId}`}
      >
        Back to Job Details
      </Link>
    </div>
  );
}

export default EditJobPage;
