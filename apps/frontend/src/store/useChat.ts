import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ChatStreamError,
    deleteChatSession,
    listChatMessages,
    listChatSessions,
    sendChatMessageStream,
    updateChatSession,
    type ChatMessage,
    type ChatSession,
} from "@/api/chat";
import { ApiError } from "@/api/client";

type ChatStateStatus = "idle" | "loading" | "ready";

const sessionPageSize = 50;

function getErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "操作失败，请稍后重试";
}

function sortSessions(sessions: ChatSession[]) {
    return [...sessions].sort((first, second) => {
        const firstTime = first.lastMessageAt ?? first.updatedAt;
        const secondTime = second.lastMessageAt ?? second.updatedAt;

        return new Date(secondTime).getTime() - new Date(firstTime).getTime();
    });
}

function upsertSession(sessions: ChatSession[], nextSession: ChatSession) {
    const exists = sessions.some((session) => session.id === nextSession.id);
    const nextSessions = exists
        ? sessions.map((session) =>
            session.id === nextSession.id ? nextSession : session,
        )
        : [nextSession, ...sessions];

    return sortSessions(nextSessions);
}

function upsertMessage(messages: ChatMessage[], nextMessage: ChatMessage) {
    const exists = messages.some((message) => message.id === nextMessage.id);
    const nextMessages = exists
        ? messages.map((message) =>
            message.id === nextMessage.id ? nextMessage : message,
        )
        : [...messages, nextMessage];

    return nextMessages.sort((first, second) => first.sequenceNo - second.sequenceNo);
}

function touchSession(
    sessions: ChatSession[],
    sessionId: string,
    updatedAt: string,
) {
    return sortSessions(
        sessions.map((session) =>
            session.id === sessionId
                ? {
                    ...session,
                    lastMessageAt: updatedAt,
                    updatedAt,
                }
                : session,
        ),
    );
}

function makeStreamingMessage(
    sessionId: string,
    content: string,
    sequenceNo: number,
): ChatMessage {
    return {
        id: `streaming-${sessionId}`,
        sessionId,
        role: "assistant",
        content,
        status: "completed",
        sequenceNo,
        model: null,
        promptTokens: null,
        completionTokens: null,
        errorMessage: null,
        createdAt: new Date().toISOString(),
    };
}

export function useChat() {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sessionsStatus, setSessionsStatus] = useState<ChatStateStatus>("idle");
    const [sending, setSending] = useState(false);
    const streamSessionIdRef = useRef<string | null>(null);

    const activeSession = useMemo(
        () => sessions.find((session) => session.id === activeSessionId) ?? null,
        [activeSessionId, sessions],
    );

    const loadSessions = useCallback(async () => {
        setSessionsStatus("loading");
        setError(null);

        try {
            const response = await listChatSessions({
                status: "active",
                page: 1,
                pageSize: sessionPageSize,
            });

            setSessions(response.items);
            setActiveSessionId((current) => current ?? response.items[0]?.id ?? null);
        } catch (loadError) {
            setError(getErrorMessage(loadError));
        } finally {
            setSessionsStatus("ready");
        }
    }, []);

    useEffect(() => {
        void loadSessions();
    }, [loadSessions]);

    useEffect(() => {
        if (!activeSessionId) {
            setMessages([]);
            return;
        }

        let ignore = false;
        setLoadingMessages(true);
        setError(null);

        listChatMessages(activeSessionId)
            .then((response) => {
                if (ignore) return;
                setSessions((current) => upsertSession(current, response.session));
                setMessages(response.items);
            })
            .catch((loadError: unknown) => {
                if (ignore) return;
                setError(getErrorMessage(loadError));
            })
            .finally(() => {
                if (!ignore) {
                    setLoadingMessages(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [activeSessionId]);

    const startNewSession = useCallback(() => {
        setError(null);
        setActiveSessionId(null);
        setMessages([]);
    }, []);

    const renameSession = useCallback(
        async (sessionId: string, title: string) => {
            setError(null);

            try {
                const { session } = await updateChatSession(sessionId, { title });
                setSessions((current) => upsertSession(current, session));
            } catch (renameError) {
                setError(getErrorMessage(renameError));
            }
        },
        [],
    );

    const removeSession = useCallback(
        async (sessionId: string) => {
            setError(null);

            try {
                await deleteChatSession(sessionId);
                setSessions((current) =>
                    current.filter((session) => session.id !== sessionId),
                );

                if (sessionId === activeSessionId) {
                    const nextSession = sessions.find((session) => session.id !== sessionId);
                    setActiveSessionId(nextSession?.id ?? null);
                    setMessages([]);
                }
            } catch (deleteError) {
                setError(getErrorMessage(deleteError));
            }
        },
        [activeSessionId, sessions],
    );

    const sendMessage = useCallback(
        async (content: string) => {
            if (sending) return;

            setSending(true);
            setError(null);
            streamSessionIdRef.current = activeSessionId;
            let assistantContent = "";
            let nextAssistantSequence = messages.length + 2;

            try {
                await sendChatMessageStream(
                    {
                        content,
                        sessionId: activeSessionId ?? undefined,
                    },
                    {
                        onSession: (session) => {
                            streamSessionIdRef.current = session.id;
                            setSessions((current) => upsertSession(current, session));
                            setActiveSessionId(session.id);
                        },
                        onUserMessage: (message) => {
                            nextAssistantSequence = message.sequenceNo + 1;
                            setMessages((current) => upsertMessage(current, message));
                            setSessions((current) =>
                                touchSession(current, message.sessionId, message.createdAt),
                            );
                        },
                        onAssistantDelta: (delta) => {
                            assistantContent += delta;
                            const sessionId = streamSessionIdRef.current;

                            if (!sessionId) return;

                            const streamingMessage = makeStreamingMessage(
                                sessionId,
                                assistantContent,
                                nextAssistantSequence,
                            );

                            setMessages((current) => upsertMessage(current, streamingMessage));
                        },
                        onAssistantMessage: (message) => {
                            setMessages((current) =>
                                upsertMessage(
                                    current.filter(
                                        (item) => item.id !== `streaming-${message.sessionId}`,
                                    ),
                                    message,
                                ),
                            );
                            setSessions((current) =>
                                touchSession(current, message.sessionId, message.createdAt),
                            );
                        },
                        onError: (streamError) => {
                            if (streamError.assistantMessage) {
                                setMessages((current) =>
                                    upsertMessage(current, streamError.assistantMessage!),
                                );
                            }
                        },
                    },
                );

            } catch (sendError) {
                if (sendError instanceof ChatStreamError && sendError.assistantMessage) {
                    setError(sendError.message);
                } else {
                    setError(getErrorMessage(sendError));
                }
            } finally {
                setSending(false);
                streamSessionIdRef.current = null;
            }
        },
        [activeSessionId, messages.length, sending],
    );

    return {
        activeSession,
        activeSessionId,
        error,
        loadingMessages,
        loadingSessions: sessionsStatus !== "ready",
        messages,
        refreshSessions: loadSessions,
        removeSession,
        renameSession,
        selectSession: setActiveSessionId,
        sendMessage,
        sending,
        sessions,
        startNewSession,
    };
}
