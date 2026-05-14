import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
    clearTestDatabase,
    closeTestDatabase,
    setupTestDatabase
} from "../helpers/database.js";
import { createTestRequest } from "../helpers/request.js";

type TestRequest = Awaited<ReturnType<typeof createTestRequest>>;

type SseEvent = {
    event: string;
    data: unknown;
};

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

const parseSse = (text: string) =>
    text
        .trim()
        .split("\n\n")
        .filter(Boolean)
        .map((block) => {
            const lines = block.split("\n");
            const event = lines
                .find((line) => line.startsWith("event: "))
                ?.slice("event: ".length);
            const data = lines
                .find((line) => line.startsWith("data: "))
                ?.slice("data: ".length);

            return {
                event: event ?? "",
                data: data ? JSON.parse(data) : null
            };
        }) as SseEvent[];

const sendMessage = async (
    token: string,
    body: Record<string, unknown>
) => {
    const response = await api
        .post("/api/chat/stream")
        .set("Authorization", `Bearer ${token}`)
        .set("Accept", "text/event-stream")
        .send(body);

    return {
        response,
        events: parseSse(response.text)
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

describe("chat e2e", () => {
    it("requires login for chat APIs", async () => {
        const response = await api.get("/api/chat/sessions");

        expect(response.status).toBe(401);
        expect(response.body.error).toMatchObject({
            code: "UNAUTHORIZED",
            message: "未登录或 token 无效"
        });
    });

    it("creates, lists, updates and deletes sessions", async () => {
        const { token } = await registerUser();

        const createResponse = await api
            .post("/api/chat/sessions")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "新的聊天" });

        expect(createResponse.status).toBe(200);
        expect(createResponse.body.data.session).toMatchObject({
            id: expect.any(String),
            title: "新的聊天",
            status: "active",
            lastMessageAt: null
        });

        const sessionId = createResponse.body.data.session.id;
        const listResponse = await api
            .get("/api/chat/sessions")
            .set("Authorization", `Bearer ${token}`);

        expect(listResponse.status).toBe(200);
        expect(listResponse.body.data).toMatchObject({
            page: 1,
            pageSize: 20,
            total: 1
        });
        expect(listResponse.body.data.items).toHaveLength(1);

        const updateResponse = await api
            .patch(`/api/chat/sessions/${sessionId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "登录页设计方案", status: "archived" });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.data.session).toMatchObject({
            id: sessionId,
            title: "登录页设计方案",
            status: "archived"
        });

        const deleteResponse = await api
            .delete(`/api/chat/sessions/${sessionId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toEqual({
            data: { success: true },
            error: null
        });
    });

    it("auto creates a session, streams a stub reply and stores messages", async () => {
        const { token } = await registerUser();
        const { response, events } = await sendMessage(token, {
            content: "帮我设计一个登录页面"
        });

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/event-stream");
        expect(events.map((event) => event.event)).toEqual([
            "session",
            "user_message",
            "assistant_delta",
            "assistant_delta",
            "assistant_message",
            "done"
        ]);

        const session = events[0]?.data as { id: string; title: string };
        const userMessage = events[1]?.data as { content: string; sequenceNo: number };
        const assistantMessage = events[4]?.data as {
            content: string;
            role: string;
            sequenceNo: number;
            model: string;
        };

        expect(session.title).toBe("帮我设计一个登录页面");
        expect(userMessage).toMatchObject({
            content: "帮我设计一个登录页面",
            sequenceNo: 1
        });
        expect(assistantMessage).toMatchObject({
            role: "assistant",
            content: "已收到：帮我设计一个登录页面",
            sequenceNo: 2,
            model: "local-stub"
        });

        const messagesResponse = await api
            .get(`/api/chat/sessions/${session.id}/messages`)
            .set("Authorization", `Bearer ${token}`);

        expect(messagesResponse.status).toBe(200);
        expect(messagesResponse.body.data.items).toHaveLength(2);
        expect(messagesResponse.body.data.items[0]).toMatchObject({
            role: "user",
            sequenceNo: 1
        });
        expect(messagesResponse.body.data.items[1]).toMatchObject({
            role: "assistant",
            sequenceNo: 2
        });

        const secondMessage = await sendMessage(token, {
            sessionId: session.id,
            content: "继续细化"
        });
        const secondUserMessage = secondMessage.events[1]?.data as {
            content: string;
            sequenceNo: number;
        };
        const secondAssistantMessage = secondMessage.events[4]?.data as {
            role: string;
            sequenceNo: number;
        };

        expect(secondMessage.response.status).toBe(200);
        expect(secondUserMessage).toMatchObject({
            content: "继续细化",
            sequenceNo: 3
        });
        expect(secondAssistantMessage).toMatchObject({
            role: "assistant",
            sequenceNo: 4
        });

        const continuedMessagesResponse = await api
            .get(`/api/chat/sessions/${session.id}/messages`)
            .set("Authorization", `Bearer ${token}`);

        expect(continuedMessagesResponse.body.data.items).toHaveLength(4);
    });

    it("prevents users from accessing another user's session", async () => {
        const alice = await registerUser("alice");
        const bob = await registerUser("bob");
        const createResponse = await api
            .post("/api/chat/sessions")
            .set("Authorization", `Bearer ${alice.token}`)
            .send({ title: "Alice session" });
        const sessionId = createResponse.body.data.session.id;

        const response = await api
            .get(`/api/chat/sessions/${sessionId}/messages`)
            .set("Authorization", `Bearer ${bob.token}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toMatchObject({
            code: "CHAT_SESSION_NOT_FOUND",
            message: "聊天会话不存在或无权访问"
        });
    });

    it("rejects messages for archived sessions", async () => {
        const { token } = await registerUser();
        const createResponse = await api
            .post("/api/chat/sessions")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Archived" });
        const sessionId = createResponse.body.data.session.id;

        await api
            .patch(`/api/chat/sessions/${sessionId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "archived" });

        const response = await api
            .post("/api/chat/stream")
            .set("Authorization", `Bearer ${token}`)
            .send({ sessionId, content: "继续聊" });

        expect(response.status).toBe(409);
        expect(response.body.error).toMatchObject({
            code: "CHAT_SESSION_ARCHIVED",
            message: "聊天会话已归档，不能继续发送消息"
        });
    });

    it("rejects overlong messages", async () => {
        const { token } = await registerUser();
        const response = await api
            .post("/api/chat/stream")
            .set("Authorization", `Bearer ${token}`)
            .send({ content: "a".repeat(4001) });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatchObject({
            code: "MESSAGE_TOO_LONG",
            message: "消息内容超过长度限制"
        });
    });

});
