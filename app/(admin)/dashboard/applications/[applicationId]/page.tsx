
import Link from "next/link";

export const instant = false;

type Props = {
  params: Promise<{ applicationId: string }>;
};

async function ApplicationDetailsPage({ params }: Props) {
  const { applicationId } = await params;

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-4xl font-bold">Application Details</h1>

      <p className="text-gray-500">
        Application ID: {applicationId}
      </p>

      <Link
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        href={`/dashboard/applications/${applicationId}/review`}
      >
        Review Application
      </Link>

      <Link
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        href="/dashboard/applications"
      >
        Back to Applications
      </Link>
    </div>
  );
}

export default ApplicationDetailsPage;
