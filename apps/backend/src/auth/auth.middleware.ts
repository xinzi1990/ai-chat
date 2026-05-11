import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../http/api-error.js";
import { sendError } from "../http/response.js";
import { findUserById, isTokenRevoked } from "./auth.repository.js";
import { verifyJwt } from "./jwt.js";
import type { JwtPayload, User } from "./types.js";

export type AuthContext = {
    user: User;
    payload: JwtPayload;
    token: string;
};

export type AuthenticatedRequest = Request & {
    auth: AuthContext;
};

const getBearerToken = (request: Request) => {
    const authorization = request.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return null;
    }

    return authorization.slice("Bearer ".length).trim();
};

export const requireAuth = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        const token = getBearerToken(request);
        const payload = token ? verifyJwt(token) : null;

        if (!token || !payload || (await isTokenRevoked(payload.jti))) {
            throw new ApiError(401, "UNAUTHORIZED", "未登录或 token 无效");
        }

        const user = await findUserById(payload.sub);

        if (!user) {
            throw new ApiError(401, "UNAUTHORIZED", "未登录或 token 无效");
        }

        if (user.status !== "active") {
            throw new ApiError(403, "USER_DISABLED", "用户已被禁用");
        }

        (request as AuthenticatedRequest).auth = {
            user,
            payload,
            token
        };

        next();
    } catch (error) {
        sendError(response, error);
    }
};
