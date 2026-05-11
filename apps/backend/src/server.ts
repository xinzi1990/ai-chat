import "./config/env.js";

import { createApp } from "./app.js";
import { mysqlPool } from "./db/pool.js";

const app = createApp();
const port = Number(process.env.PORT ?? 3001);

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
