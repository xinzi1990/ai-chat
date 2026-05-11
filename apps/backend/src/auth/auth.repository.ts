import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { mysqlPool } from "../db/pool.js";
import { mapUserRow } from "./user-mapper.js";
import type { User, UserRow } from "./types.js";

type RevokedTokenRow = RowDataPacket & {
  count: number;
};

export const findUserByUsername = async (username: string): Promise<User | null> => {
  const [rows] = await mysqlPool.execute<UserRow[]>(
    `SELECT id, username, password_hash, status
       FROM users
      WHERE username = ?
      LIMIT 1`,
    [username]
  );

  return rows[0] ? mapUserRow(rows[0]) : null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const [rows] = await mysqlPool.execute<UserRow[]>(
    `SELECT id, username, password_hash, status
       FROM users
      WHERE id = ?
      LIMIT 1`,
    [id]
  );

  return rows[0] ? mapUserRow(rows[0]) : null;
};

export const createUser = async (
  username: string,
  passwordHash: string
): Promise<User> => {
  const [result] = await mysqlPool.execute<ResultSetHeader>(
    `INSERT INTO users (username, password_hash, status)
     VALUES (?, ?, 'active')`,
    [username, passwordHash]
  );

  return {
    id: String(result.insertId),
    username,
    passwordHash,
    status: "active"
  };
};

export const isTokenRevoked = async (jti: string): Promise<boolean> => {
  const [rows] = await mysqlPool.execute<RevokedTokenRow[]>(
    `SELECT COUNT(*) AS count
       FROM revoked_tokens
      WHERE jti = ?`,
    [jti]
  );

  return Number(rows[0]?.count ?? 0) > 0;
};

export const revokeToken = async (
  jti: string,
  userId: string,
  expiresAt: Date
) => {
  await mysqlPool.execute(
    `INSERT IGNORE INTO revoked_tokens (jti, user_id, expires_at)
     VALUES (?, ?, ?)`,
    [jti, userId, expiresAt]
  );
};
