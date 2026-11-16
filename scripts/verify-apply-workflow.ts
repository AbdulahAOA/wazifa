import { eq, or } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db/client";
import { jobs, users } from "../lib/db/schema";
import { toPublicUser } from "../lib/services/accounts";
import { submitApplication } from "../lib/services/applications";
import { loadEnv } from "../lib/env";

async function main() {
  const db = await getDb();
  const [candidate] = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.email, "verify.candidate.1025@wazifa.test"),
        eq(users.email, "e2e.candidate.1025@wazifa.test"),
      ),
    )
    .limit(1);
  const [job] = await db.select().from(jobs).where(eq(jobs.slug, "senior-frontend-engineer")).limit(1);
  if (!candidate || !job) throw new Error("Missing verification candidate or seeded job.");
  const first = await submitApplication(
    db,
    toPublicUser(candidate),
    {
      jobId: job.id,
      phone: "+20 100 000 0001",
      coverLetter: "I have shipped hiring tools and want to own this marketplace queue.",
      details: "Verification script submission",
    },
    {
      filename: "resume.pdf",
      bytes: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"),
      storageDir: loadEnv().uploadDir,
    },
  );
  const second = await submitApplication(
    db,
    toPublicUser(candidate),
    {
      jobId: job.id,
      phone: "",
      coverLetter: "I have shipped hiring tools and want to own this marketplace queue again.",
      details: "",
    },
    {
      filename: "resume-2.pdf",
      bytes: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"),
      storageDir: loadEnv().uploadDir,
    },
  );
  console.log(
    JSON.stringify({
      first: first.ok ? { id: first.data.id } : first,
      second: second.ok ? "allowed" : second.code,
      jobId: job.id,
    }),
  );
}

main()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    closeDb().finally(() => process.exit(1));
  });
