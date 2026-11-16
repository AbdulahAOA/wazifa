import { closeDb, getDb } from "../lib/db/client";
import { getDashboard, getHome } from "../lib/services/dashboard";

async function main() {
  const db = await getDb();
  const home = await getHome(db);
  const desk = await getDashboard(db, "all");
  console.log(
    JSON.stringify({
      featured: home.featured.map((job) => job.title),
      recent: home.recent.map((job) => job.title),
      categories: home.categories.map((category) => `${category.name}:${category.count}`),
      stats: home.stats,
      desk: {
        publishedJobs: desk.publishedJobs,
        applications: desk.applicationsInRange,
        pending: desk.pendingApplications,
        candidates: desk.totalCandidates,
      },
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
