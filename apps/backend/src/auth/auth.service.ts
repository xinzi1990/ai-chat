import { ApiError } from "../http/api-error.js";
import {
  createUser,
  findUserByUsername,
  revokeToken
} from "./auth.repository.js";
import { signJwt } from "./jwt.js";
import { hashPassword, verifyPassword } from "./password.js";
import { toPublicUser } from "./user-mapper.js";
import type { JwtPayload } from "./types.js";

type Credentials = {
  username: string;
  password: string;
};

const normalizeCredentials = (body: unknown): Credentials => {
  if (typeof body !== "object" || body === null) {
    throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
  }

  const { username, password } = body as Record<string, unknown>;
  const normalizedUsername =
    typeof username === "string" ? username.trim() : "";

  if (
    normalizedUsername.length < 1 ||
    normalizedUsername.length > 64 ||
    typeof password !== "string" ||
    password.length < 1
  ) {
    throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
  }

  return {
    username: normalizedUsername,
    password
  };
};

const isDuplicateUsernameError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "ER_DUP_ENTRY";

export const register = async (body: unknown) => {
  const { username, password } = normalizeCredentials(body);
  const existingUser = await findUserByUsername(username);

  if (existingUser) {
    throw new ApiError(409, "USERNAME_EXISTS", "用户名已存在");
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await createUser(username, passwordHash);
    const { token } = signJwt(user);

    return {
      user: toPublicUser(user),
      token
    };
  } catch (error) {
    if (isDuplicateUsernameError(error)) {
      throw new ApiError(409, "USERNAME_EXISTS", "用户名已存在");
    }

    throw error;
  }
};

export const login = async (body: unknown) => {
  const { username, password } = normalizeCredentials(body);
  const user = await findUserByUsername(username);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "用户名或密码错误");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "USER_DISABLED", "用户已被禁用");
  }

  const { token } = signJwt(user);

  return {
    user: toPublicUser(user),
    token
  };
};

export const logout = async (payload: JwtPayload) => {
  await revokeToken(payload.jti, payload.sub, new Date(payload.exp * 1000));

  return {
    success: true
  };
};
