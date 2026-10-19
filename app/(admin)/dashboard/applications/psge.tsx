import Link from "next/link";

function ApplicationsPage() {
  return (
    <div>
      <h1>Applications</h1>

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