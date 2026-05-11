import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  return `${HASH_PREFIX}:${salt}:${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password: string, passwordHash: string) => {
  const [prefix, salt, storedHash] = passwordHash.split(":");

  if (prefix !== HASH_PREFIX || salt === undefined || storedHash === undefined) {
    return false;
  }

  const storedKey = Buffer.from(storedHash, "hex");
  const derivedKey = (await scryptAsync(password, salt, storedKey.length)) as Buffer;

  return (
    storedKey.length === derivedKey.length &&
    timingSafeEqual(storedKey, derivedKey)
  );
};
