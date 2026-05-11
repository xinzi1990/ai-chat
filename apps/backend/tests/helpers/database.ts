import "../../src/config/env.js";

import mysql from "mysql2/promise";

const getDatabaseName = () => process.env.MYSQL_DATABASE ?? "demo_e2e";

const assertE2eDatabase = () => {
    const databaseName = getDatabaseName();

    if (!databaseName.endsWith("_e2e")) {
        throw new Error(
            `Refusing to run e2e database cleanup against '${databaseName}'. Use a database name ending with _e2e.`
        );
    }

    return databaseName;
};

const quoteIdentifier = (identifier: string) =>
    `\`${identifier.replaceAll("`", "``")}\``;

const quoteLiteral = (value: string) =>
    `'${value.replaceAll("\\", "\\\\").replaceAll("'", "''")}'`;

export const setupTestDatabase = async () => {
    const databaseName = assertE2eDatabase();
    const appUser = process.env.MYSQL_USER ?? "root";
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST ?? "127.0.0.1",
        port: Number(process.env.MYSQL_PORT ?? 3306),
        user: "root",
        password: process.env.MYSQL_ROOT_PASSWORD ?? process.env.MYSQL_PASSWORD ?? ""
    });

    try {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(databaseName)}
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await connection.query(
            `GRANT ALL PRIVILEGES ON ${quoteIdentifier(databaseName)}.* TO ${quoteLiteral(appUser)}@'%'`
        );
    } finally {
        await connection.end();
    }

    const { migrateDatabase } = await import("../../src/db/migrate.js");

    await migrateDatabase();
};

export const clearTestDatabase = async () => {
    assertE2eDatabase();

    const { mysqlPool } = await import("../../src/db/pool.js");

    await mysqlPool.execute("DELETE FROM chat_messages");
    await mysqlPool.execute("DELETE FROM chat_sessions");
    await mysqlPool.execute("DELETE FROM revoked_tokens");
    await mysqlPool.execute("DELETE FROM users");
};

export const disableUser = async (username: string) => {
    assertE2eDatabase();

    const { mysqlPool } = await import("../../src/db/pool.js");

    await mysqlPool.execute("UPDATE users SET status = 'disabled' WHERE username = ?", [
        username
    ]);
};

export const closeTestDatabase = async () => {
    const { mysqlPool } = await import("../../src/db/pool.js");

    await mysqlPool.end();
};
