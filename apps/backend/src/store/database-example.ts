import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { config } from "dotenv";
import type { RowDataPacket } from "mysql2";

config({ path: ".env" });
config({ path: ".env.example" });

type DatabaseCheckRow = RowDataPacket & {
  currentDatabase: string;
  mysqlVersion: string;
  currentTime: Date;
};

const getMysqlPool = async () => {
  const { mysqlPool } = await import("../db/pool.js");

  return mysqlPool;
};

export const checkDatabaseConnection = async () => {
  const mysqlPool = await getMysqlPool();

  const [rows] = await mysqlPool.query<DatabaseCheckRow[]>(
    "SELECT DATABASE() AS currentDatabase, VERSION() AS mysqlVersion, NOW() AS currentTime"
  );

  return rows[0];
};

const printDatabaseConnectionCheck = async () => {
  const result = await checkDatabaseConnection();

  console.log("Database connection succeeded");
  console.log(`Database: ${result.currentDatabase}`);
  console.log(`MySQL version: ${result.mysqlVersion}`);
  console.log(`Current time: ${result.currentTime}`);
};

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  printDatabaseConnectionCheck()
    .catch((error: unknown) => {
      console.error("Database connection failed");
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      const mysqlPool = await getMysqlPool();

      await mysqlPool.end();
    });
}
