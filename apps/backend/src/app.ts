import "./config/env.js";

import express from "express";

import { authRouter } from "./auth/auth.routes.js";
import { chatRouter } from "./chat/chat.routes.js";
import { corsMiddleware } from "./http/cors.js";

export const createApp = () => {
    const app = express();

    app.use(corsMiddleware);
    app.use(express.json());

    app.use("/api/auth", authRouter);
    app.use("/api/chat", chatRouter);

    app.get("/health", (_request, response) => {
        response.json({
            status: "ok",
            service: "backend"
        });
    });

    return app;
};
