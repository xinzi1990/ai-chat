import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
    clearTestDatabase,
    closeTestDatabase,
    disableUser,
    setupTestDatabase
} from "../helpers/database.js";
import { createTestRequest } from "../helpers/request.js";

type TestRequest = Awaited<ReturnType<typeof createTestRequest>>;

let api: TestRequest;

const registerUser = async (username = "alice", password = "password123") => {
    const response = await api.post("/api/auth/register").send({
        username,
        password
    });

    return response.body.data as {
        user: {
            id: string;
            username: string;
        };
        token: string;
    };
};

beforeAll(async () => {
    await setupTestDatabase();
    api = await createTestRequest();
});

beforeEach(async () => {
    await clearTestDatabase();
});

afterAll(async () => {
    await closeTestDatabase();
});

describe("backend e2e", () => {
    it("returns health status", async () => {
        const response = await api.get("/health");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: "ok",
            service: "backend"
        });
    });

    it("registers a user and returns a public user with a token", async () => {
        const response = await api.post("/api/auth/register").send({
            username: " alice ",
            password: "password123"
        });

        expect(response.status).toBe(200);
        expect(response.body.error).toBeNull();
        expect(response.body.data.user).toMatchObject({
            id: expect.any(String),
            username: "alice"
        });
        expect(response.body.data.user).not.toHaveProperty("password");
        expect(response.body.data.user).not.toHaveProperty("passwordHash");
        expect(response.body.data.token).toEqual(expect.any(String));
    });

    it("rejects duplicate usernames", async () => {
        await registerUser("alice");

        const response = await api.post("/api/auth/register").send({
            username: "alice",
            password: "another-password"
        });

        expect(response.status).toBe(409);
        expect(response.body).toMatchObject({
            data: null,
            error: {
                code: "USERNAME_EXISTS",
                message: "用户名已存在"
            }
        });
    });

    it("rejects invalid register requests", async () => {
        const response = await api.post("/api/auth/register").send({
            username: "",
            password: "password123"
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatchObject({
            code: "INVALID_REQUEST",
            message: "请求参数不合法"
        });
    });

    it("logs in with valid credentials", async () => {
        await registerUser("alice", "password123");

        const response = await api.post("/api/auth/login").send({
            username: "alice",
            password: "password123"
        });

        expect(response.status).toBe(200);
        expect(response.body.error).toBeNull();
        expect(response.body.data.user).toMatchObject({
            id: expect.any(String),
            username: "alice"
        });
        expect(response.body.data.token).toEqual(expect.any(String));
    });

    it("rejects invalid login credentials", async () => {
        await registerUser("alice", "password123");

        const response = await api.post("/api/auth/login").send({
            username: "alice",
            password: "wrong-password"
        });

        expect(response.status).toBe(401);
        expect(response.body.error).toMatchObject({
            code: "INVALID_CREDENTIALS",
            message: "用户名或密码错误"
        });
    });

    it("rejects disabled users during login", async () => {
        await registerUser("alice", "password123");
        await disableUser("alice");

        const response = await api.post("/api/auth/login").send({
            username: "alice",
            password: "password123"
        });

        expect(response.status).toBe(403);
        expect(response.body.error).toMatchObject({
            code: "USER_DISABLED",
            message: "用户已被禁用"
        });
    });

    it("returns the current user for a valid token", async () => {
        const { token } = await registerUser("alice", "password123");

        const response = await api
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            data: {
                user: {
                    id: expect.any(String),
                    username: "alice"
                }
            },
            error: null
        });
        expect(response.body.data).not.toHaveProperty("token");
    });

    it("rejects missing or invalid tokens", async () => {
        const missingTokenResponse = await api.get("/api/auth/me");
        const invalidTokenResponse = await api
            .get("/api/auth/me")
            .set("Authorization", "Bearer invalid-token");

        expect(missingTokenResponse.status).toBe(401);
        expect(missingTokenResponse.body.error).toMatchObject({
            code: "UNAUTHORIZED",
            message: "未登录或 token 无效"
        });
        expect(invalidTokenResponse.status).toBe(401);
        expect(invalidTokenResponse.body.error).toMatchObject({
            code: "UNAUTHORIZED",
            message: "未登录或 token 无效"
        });
    });

    it("revokes the current token on logout", async () => {
        const { token } = await registerUser("alice", "password123");

        const logoutResponse = await api
            .post("/api/auth/logout")
            .set("Authorization", `Bearer ${token}`);

        expect(logoutResponse.status).toBe(200);
        expect(logoutResponse.body).toEqual({
            data: {
                success: true
            },
            error: null
        });

        const meResponse = await api
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(meResponse.status).toBe(401);
        expect(meResponse.body.error).toMatchObject({
            code: "UNAUTHORIZED",
            message: "未登录或 token 无效"
        });
    });
});
