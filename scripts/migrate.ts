import { closeDb, getDb } from "../lib/db/client";

getDb()
  .then(() => {
    console.log("Migrations applied.");
    return closeDb();
  })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    closeDb().finally(() => process.exit(1));
  });
