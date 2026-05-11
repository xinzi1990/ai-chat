import type { Request, Response, NextFunction } from "express";

const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173"];

const allowedOrigins = (
    process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ??
  DEFAULT_ALLOWED_ORIGINS
);

const isAllowedOrigin = (origin: string) =>
    allowedOrigins.includes("*") || allowedOrigins.includes(origin);

export const corsMiddleware = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const origin = request.header("origin");

    if (origin && isAllowedOrigin(origin)) {
        response.header("Access-Control-Allow-Origin", origin);
        response.header("Vary", "Origin");
    }

    response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (request.method === "OPTIONS") {
        response.sendStatus(204);
        return;
    }

    next();
};
