import type { ChatMessage, ChatMessageRow, ChatSession, ChatSessionRow } from "./types.js";

const toIsoString = (value: Date | string) =>
    value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export const toPublicSession = (session: ChatSession) => ({
    id: session.id,
    title: session.title,
    status: session.status,
    lastMessageAt: session.lastMessageAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
});

export const toPublicMessage = (message: ChatMessage) => ({
    id: message.id,
    sessionId: message.sessionId,
    role: message.role,
    content: message.content,
    status: message.status,
    sequenceNo: message.sequenceNo,
    model: message.model,
    promptTokens: message.promptTokens,
    completionTokens: message.completionTokens,
    errorMessage: message.errorMessage,
    createdAt: message.createdAt
});

export const mapSessionRow = (row: ChatSessionRow): ChatSession => ({
    id: String(row.id),
    userId: String(row.user_id),
    title: row.title,
    status: row.status,
    lastMessageAt: row.last_message_at ? toIsoString(row.last_message_at) : null,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
});

export const mapMessageRow = (row: ChatMessageRow): ChatMessage => ({
    id: String(row.id),
    sessionId: String(row.session_id),
    userId: String(row.user_id),
    role: row.role,
    content: row.content,
    status: row.status,
    sequenceNo: row.sequence_no,
    model: row.model,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    errorMessage: row.error_message,
    createdAt: toIsoString(row.created_at)
});
