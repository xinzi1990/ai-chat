import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

if (process.env.NODE_ENV === "test") {
    config({ path: resolve(backendRoot, ".env.test") });
}

config({ path: resolve(backendRoot, ".env") });
config({ path: resolve(backendRoot, ".env.example") });
