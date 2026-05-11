import type { RowDataPacket } from "mysql2";

export type ChatSessionStatus = "active" | "archived";
export type ChatMessageRole = "user" | "assistant";
export type ChatMessageStatus = "completed" | "failed";

export type ChatSession = {
    id: string;
    userId: string;
    title: string;
    status: ChatSessionStatus;
    lastMessageAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ChatMessage = {
    id: string;
    sessionId: string;
    userId: string;
    role: ChatMessageRole;
    content: string;
    status: ChatMessageStatus;
    sequenceNo: number;
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    errorMessage: string | null;
    createdAt: string;
};

export type ChatSessionRow = RowDataPacket & {
    id: number | string;
    user_id: number | string;
    title: string;
    status: ChatSessionStatus;
    last_message_at: Date | string | null;
    created_at: Date | string;
    updated_at: Date | string;
};

export type ChatMessageRow = RowDataPacket & {
    id: number | string;
    session_id: number | string;
    user_id: number | string;
    role: ChatMessageRole;
    content: string;
    status: ChatMessageStatus;
    sequence_no: number;
    model: string | null;
    prompt_tokens: number | null;
    completion_tokens: number | null;
    error_message: string | null;
    created_at: Date | string;
};
