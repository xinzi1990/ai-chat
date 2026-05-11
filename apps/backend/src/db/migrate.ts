import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import "../config/env.js";

import { schemaStatements } from "./schema.js";

export const migrateDatabase = async () => {
  const { mysqlPool } = await import("./pool.js");

  for (const statement of schemaStatements) {
    await mysqlPool.execute(statement);
  }
};

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  migrateDatabase()
    .then(() => {
      console.log("Database migration completed");
    })
    .catch((error: unknown) => {
      console.error("Database migration failed");
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      const { mysqlPool } = await import("./pool.js");

      await mysqlPool.end();
    });
}
