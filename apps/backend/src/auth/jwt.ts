import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { authConfig } from "../config/auth.js";
import type { JwtPayload, User } from "./types.js";

const encoder = new TextEncoder();

const base64UrlEncode = (input: string | Buffer) =>
    Buffer.from(input)
        .toString("base64url");

const base64UrlDecode = (input: string) =>
    Buffer.from(input, "base64url").toString("utf8");

const signPart = (value: string) =>
    createHmac("sha256", authConfig.jwtSecret).update(value).digest("base64url");

const compareSignature = (actual: string, expected: string) => {
    const actualBytes = encoder.encode(actual);
    const expectedBytes = encoder.encode(expected);

    return (
        actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
    );
};

export const signJwt = (user: Pick<User, "id" | "username">) => {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + authConfig.jwtExpiresInDays * 24 * 60 * 60;
    const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        jti: randomUUID(),
        iat: now,
        exp: expiresAt
    };
    const body = base64UrlEncode(JSON.stringify(payload));
    const signature = signPart(`${header}.${body}`);

    return {
        token: `${header}.${body}.${signature}`,
        payload
    };
};

export const verifyJwt = (token: string): JwtPayload | null => {
    const [header, body, signature] = token.split(".");

    if (!header || !body || !signature) {
        return null;
    }

    const expectedSignature = signPart(`${header}.${body}`);

    if (!compareSignature(signature, expectedSignature)) {
        return null;
    }

    let payload: Partial<JwtPayload>;

    try {
        payload = JSON.parse(base64UrlDecode(body)) as Partial<JwtPayload>;
    } catch {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (
        typeof payload.sub !== "string" ||
    typeof payload.username !== "string" ||
    typeof payload.jti !== "string" ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number" ||
    payload.exp <= now
    ) {
        return null;
    }

    return payload as JwtPayload;
};
