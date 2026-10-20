
import Link from "next/link";

export const instant = false;

function ApplicationsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-4xl font-bold">Applications</h1>

      <Link
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        href="/dashboard/applications/new"
      >
        Create Application
      </Link>

      <Link
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        href="/dashboard/applications/123"
      >
        View Application
      </Link>

      <Link
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        href="/dashboard/applications/123/review"
      >
        Review Application
      </Link>
    </div>
  );
}

export default ApplicationsPage;
