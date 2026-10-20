
export const instant = false;

type Props = {
  params: Promise<{ applicationId: string }>;
};

async function ApplicationReviewPage({ params }: Props) {
  const { applicationId } = await params;

  console.log(applicationId);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-4xl font-bold">Application Review</h1>

      <p className="text-gray-500">
        Application ID: {applicationId}
      </p>
    </div>
  );
}

export default ApplicationReviewPage;
