async function main() {
  const page = await fetch("http://127.0.0.1:3000/dashboard/jobs/new", { redirect: "manual" });
  const unauthNewJob = { status: page.status, location: page.headers.get("location") };

  const body = new URLSearchParams({
    title: "Unauthorized Job",
    company: "Nope",
    location: "Cairo",
    salaryMin: "1",
    description: "A visitor must not be able to create this job through a raw POST.",
    employmentType: "Full-time",
    experienceLevel: "Mid",
    categoryId: "not-a-real-category",
    intent: "publish",
  });
  const posted = await fetch("http://127.0.0.1:3000/dashboard/jobs/new", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual",
  });
  const file = await fetch("http://127.0.0.1:3000/api/files/85407fa6-eec1-4434-a6c6-a13a924ee06e", {
    redirect: "manual",
  });
  console.log(
    JSON.stringify({
      unauthNewJob,
      rawPostStatus: posted.status,
      rawPostLocation: posted.headers.get("location"),
      rawPostHasJobTitle: (await posted.text()).includes("Unauthorized Job"),
      unauthFile: file.status,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
