import { ApiError } from "../http/api-error.js";
import { createAssistantReply } from "./ai.client.js";
import { toPublicMessage, toPublicSession } from "./chat.mapper.js";
import {
    appendMessage,
    createSession,
    deleteSession,
    findSessionById,
    listAllCompletedMessages,
    listMessages,
    listSessions,
    updateSession
} from "./chat.repository.js";
import {
    assertId,
    getBodyRecord,
    parseAfterSequenceNo,
    parseContent,
    parseMessageLimit,
    parsePage,
    parsePageSize,
    parseStatus,
    parseTitle
} from "./chat.validation.js";

const defaultTitle = "新的聊天";

const makeTitleFromContent = (content: string) =>
    content.length > 120 ? content.slice(0, 120) : content;

const assertSession = async (userId: string, sessionId: string) => {
    const session = await findSessionById(userId, sessionId);

    if (!session) {
        throw new ApiError(404, "CHAT_SESSION_NOT_FOUND", "聊天会话不存在或无权访问");
    }

    return session;
};

export const getSessions = async (userId: string, query: Record<string, unknown>) => {
    const status = parseStatus(query.status, "active") ?? "active";
    const page = parsePage(query.page);
    const pageSize = parsePageSize(query.pageSize);
    const { items, total } = await listSessions(userId, status, page, pageSize);

    return {
        items: items.map(toPublicSession),
        page,
        pageSize,
        total
    };
};

export const createChatSession = async (userId: string, body: unknown) => {
    const record = getBodyRecord(body);
    const title = parseTitle(record.title) ?? defaultTitle;
    const session = await createSession(userId, title);

    return {
        session: toPublicSession(session)
    };
};

export const updateChatSession = async (
    userId: string,
    sessionId: string,
    body: unknown
) => {
    const id = assertId(sessionId);
    await assertSession(userId, id);

    const record = getBodyRecord(body);
    const title = parseTitle(record.title);
    const status = parseStatus(record.status);

    if (title === undefined && status === undefined) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    const session = await updateSession(userId, id, { title, status });

    if (!session) {
        throw new ApiError(404, "CHAT_SESSION_NOT_FOUND", "聊天会话不存在或无权访问");
    }

    return {
        session: toPublicSession(session)
    };
};

export const deleteChatSession = async (userId: string, sessionId: string) => {
    const id = assertId(sessionId);
    const deleted = await deleteSession(userId, id);

    if (!deleted) {
        throw new ApiError(404, "CHAT_SESSION_NOT_FOUND", "聊天会话不存在或无权访问");
    }

    return {
        success: true
    };
};

export const getSessionMessages = async (
    userId: string,
    sessionId: string,
    query: Record<string, unknown>
) => {
    const id = assertId(sessionId);
    const session = await assertSession(userId, id);
    const afterSequenceNo = parseAfterSequenceNo(query.afterSequenceNo);
    const limit = parseMessageLimit(query.limit);
    const { items, hasMore } = await listMessages(userId, id, afterSequenceNo, limit);

    return {
        session: toPublicSession(session),
        items: items.map(toPublicMessage),
        hasMore
    };
};

export const createUserChatMessage = async (userId: string, body: unknown) => {
    const record = getBodyRecord(body);
    const content = parseContent(record.content);
    const session = record.sessionId
        ? await assertSession(userId, assertId(record.sessionId))
        : await createSession(userId, makeTitleFromContent(content));

    if (session.status === "archived") {
        throw new ApiError(409, "CHAT_SESSION_ARCHIVED", "聊天会话已归档，不能继续发送消息");
    }

    const userMessage = await appendMessage(
        userId,
        session,
        {
            role: "user",
            content
        }
    );
    const refreshedSession = await assertSession(userId, session.id);
    const historyMessages = await listAllCompletedMessages(userId, session.id);

    return {
        session: toPublicSession(refreshedSession),
        userMessage: toPublicMessage(userMessage),
        historyMessages
    };
};

export const generateAssistantChatMessage = async (
    userId: string,
    sessionId: string,
    historyMessages: Awaited<ReturnType<typeof listAllCompletedMessages>>,
    onDelta: (content: string) => void
) => {
    const session = await assertSession(userId, sessionId);
    const assistant = await createAssistantReply(historyMessages, onDelta);
    const assistantMessage = await appendMessage(userId, session, {
        role: "assistant",
        content: assistant.content,
        model: assistant.model,
        promptTokens: assistant.promptTokens,
        completionTokens: assistant.completionTokens
    });

    return toPublicMessage(assistantMessage);
};

export const createFailedAssistantMessage = async (
    userId: string,
    sessionId: string,
    error: unknown
) => {
    const session = await assertSession(userId, sessionId);
    const errorMessage = error instanceof Error ? error.message : "AI response failed";
    const assistantMessage = await appendMessage(userId, session, {
        role: "assistant",
        content: "",
        status: "failed",
        errorMessage
    });

    return toPublicMessage(assistantMessage);
};

export const toAiResponseError = (error: unknown) => {
    if (error instanceof ApiError && error.code === "AI_RESPONSE_FAILED") {
        return {
            code: error.code,
            message: error.message
        };
    }

    return {
        code: "AI_RESPONSE_FAILED",
        message: "AI 回复生成失败"
    };
};
