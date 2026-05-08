import "dotenv/config";

import express from "express";

import { mysqlPool } from "./db/pool.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "backend"
  });
});

const server = app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await mysqlPool.end();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
