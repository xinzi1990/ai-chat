import type { PublicUser, User, UserRow } from "./types.js";

export const mapUserRow = (row: UserRow): User => ({
  id: String(row.id),
  username: row.username,
  passwordHash: row.password_hash,
  status: row.status
});

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  username: user.username
});
