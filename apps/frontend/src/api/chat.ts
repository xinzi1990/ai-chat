import { API_BASE_URL } from "@/config/env";
import { ApiError, requestApi } from "@/api/client";
import { getStoredToken } from "@/utils/tokenStorage";
import { readSseStream, type SseEvent } from "@/utils/sse";

export type ChatSessionStatus = "active" | "archived";
export type ChatMessageRole = "user" | "assistant";
export type ChatMessageStatus = "completed" | "failed";

export type ChatSession = {
    id: string;
    title: string;
    status: ChatSessionStatus;
    lastMessageAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ChatMessage = {
    id: string;
    sessionId: string;
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

export type ListChatSessionsParams = {
    status?: ChatSessionStatus;
    page?: number;
    pageSize?: number;
};

export type CreateChatSessionRequest = {
    title?: string;
};

export type UpdateChatSessionRequest = {
    title?: string;
    status?: ChatSessionStatus;
};

export type ListChatMessagesParams = {
    afterSequenceNo?: number;
    limit?: number;
};

export type SendChatMessageRequest = {
    sessionId?: string;
    content: string;
};

export type ChatStreamErrorPayload = {
    code: string;
    message: string;
    assistantMessage?: ChatMessage;
};

export type SendChatMessageStreamOptions = {
    signal?: AbortSignal;
    token?: string | null;
    onSession?: (session: ChatSession) => void | Promise<void>;
    onUserMessage?: (message: ChatMessage) => void | Promise<void>;
    onAssistantDelta?: (content: string) => void | Promise<void>;
    onAssistantMessage?: (message: ChatMessage) => void | Promise<void>;
    onDone?: () => void | Promise<void>;
    onError?: (error: ChatStreamErrorPayload) => void | Promise<void>;
};

type ListChatSessionsResponse = {
    items: ChatSession[];
    page: number;
    pageSize: number;
    total: number;
};

type ChatSessionResponse = {
    session: ChatSession;
};

type DeleteChatSessionResponse = {
    success: boolean;
};

type ListChatMessagesResponse = {
    session: ChatSession;
    items: ChatMessage[];
    hasMore: boolean;
};

type ApiErrorPayload = {
    code: string;
    message: string;
};

type ApiResponse<T> = {
    data: T | null;
    error: ApiErrorPayload | null;
};

type AssistantDeltaEvent = {
    content: string;
};

type DoneEvent = {
    success: boolean;
};

export class ChatStreamError extends ApiError {
    assistantMessage?: ChatMessage;

    constructor(payload: ChatStreamErrorPayload) {
        super(payload.message, payload.code, 200);
        this.name = "ChatStreamError";
        this.assistantMessage = payload.assistantMessage;
    }
}

export function listChatSessions(params: ListChatSessionsParams = {}) {
    return requestApi<ListChatSessionsResponse>(
        `/api/chat/sessions${toQueryString(params)}`,
    );
}

export function createChatSession(body: CreateChatSessionRequest = {}) {
    return requestApi<ChatSessionResponse>("/api/chat/sessions", {
        method: "POST",
        body,
    });
}

export function updateChatSession(
    sessionId: string,
    body: UpdateChatSessionRequest,
) {
    return requestApi<ChatSessionResponse>(
        `/api/chat/sessions/${encodeURIComponent(sessionId)}`,
        {
            method: "PATCH",
            body,
        },
    );
}

export function deleteChatSession(sessionId: string) {
    return requestApi<DeleteChatSessionResponse>(
        `/api/chat/sessions/${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
    );
}

export function listChatMessages(
    sessionId: string,
    params: ListChatMessagesParams = {},
) {
    return requestApi<ListChatMessagesResponse>(
        `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages${toQueryString(params)}`,
    );
}

export async function sendChatMessageStream(
    body: SendChatMessageRequest,
    options: SendChatMessageStreamOptions = {},
) {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: "POST",
        headers: buildStreamHeaders(options.token ?? getStoredToken()),
        body: JSON.stringify(body),
        signal: options.signal,
    });

    const contentType = response.headers.get("Content-Type") ?? "";

    if (!response.ok || !contentType.includes("text/event-stream")) {
        await throwJsonApiError(response);
    }

    if (!response.body) {
        throw new ApiError("服务响应缺少数据", "INVALID_RESPONSE", response.status);
    }

    let receivedDone = false;

    await readSseStream(response.body, async (event) => {
        if (event.event === "done") {
            receivedDone = true;
        }

        await handleChatStreamEvent(event, options);
    });

    if (!receivedDone) {
        throw new ApiError("服务响应中断", "STREAM_INTERRUPTED", response.status);
    }
}

function buildStreamHeaders(token: string | null) {
    const headers = new Headers({
        Accept: "text/event-stream",
        "Content-Type": "application/json",
    });

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
}

async function handleChatStreamEvent(
    event: SseEvent,
    options: SendChatMessageStreamOptions,
) {
    switch (event.event) {
        case "session":
            await options.onSession?.(parseEventData<ChatSession>(event));
            break;
        case "user_message":
            await options.onUserMessage?.(parseEventData<ChatMessage>(event));
            break;
        case "assistant_delta":
            await options.onAssistantDelta?.(
                parseEventData<AssistantDeltaEvent>(event).content,
            );
            break;
        case "assistant_message":
            await options.onAssistantMessage?.(parseEventData<ChatMessage>(event));
            break;
        case "done":
            if (parseEventData<DoneEvent>(event).success) {
                await options.onDone?.();
            }
            break;
        case "error": {
            const payload = parseEventData<ChatStreamErrorPayload>(event);

            await options.onError?.(payload);
            throw new ChatStreamError(payload);
        }
    }
}

function parseEventData<T>(event: SseEvent) {
    try {
        return JSON.parse(event.data) as T;
    } catch {
        throw new ApiError("服务响应格式不正确", "INVALID_RESPONSE", 200);
    }
}

async function throwJsonApiError(response: Response): Promise<never> {
    const payload = await readJson<ApiResponse<unknown>>(response);

    if (payload?.error) {
        throw new ApiError(payload.error.message, payload.error.code, response.status);
    }

    throw new ApiError("请求失败，请稍后重试", "HTTP_ERROR", response.status);
}

async function readJson<T>(response: Response) {
    try {
        return (await response.json()) as T;
    } catch {
        return null;
    }
}

function toQueryString(params: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
            searchParams.set(key, String(value));
        }
    }

    const queryString = searchParams.toString();

    return queryString ? `?${queryString}` : "";
}
