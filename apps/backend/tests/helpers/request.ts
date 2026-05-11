import type { Express } from "express";
import request from "supertest";

export const createTestRequest = async () => {
    const { createApp } = await import("../../src/app.js");
    const app: Express = createApp();

    return request(app);
};
