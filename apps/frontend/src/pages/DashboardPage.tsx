import { useMemo, useState } from "react";
import type { AuthUser } from "@/api/auth";
import { ChatLayout } from "@/components/ChatLayout";
import "@/styles/chat.css";

type DashboardPageProps = {
    loading: boolean;
    onLogout: () => Promise<void>;
    user: AuthUser;
};

export type ChatSessionSummary = {
    id: string;
    title: string;
    status: "active" | "archived";
    lastMessageAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ChatMessageItem = {
    id: string;
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    status: "completed" | "failed";
    sequenceNo: number;
    model: string | null;
    errorMessage: string | null;
    createdAt: string;
};

const now = new Date().toISOString();

function useChatPreview() {
    const [activeSessionId, setActiveSessionId] = useState("1");
    const [sending, setSending] = useState(false);
    const [sessions, setSessions] = useState<ChatSessionSummary[]>([
        {
            id: "1",
            title: "登录页设计方案",
            status: "active",
            lastMessageAt: now,
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "2",
            title: "接口错误码梳理",
            status: "active",
            lastMessageAt: null,
            createdAt: now,
            updatedAt: now,
        },
    ]);
    const [messages, setMessages] = useState<ChatMessageItem[]>([
        {
            id: "1",
            sessionId: "1",
            role: "user",
            content: "帮我把登录页改得更适合后台工具。",
            status: "completed",
            sequenceNo: 1,
            model: null,
            errorMessage: null,
            createdAt: now,
        },
        {
            id: "2",
            sessionId: "1",
            role: "assistant",
            content:
                "可以按三个方向处理：\n- 保持信息密度\n- 减少装饰元素\n- 明确主操作\n\n```tsx\n<Button type=\"primary\">登录</Button>\n```",
            status: "completed",
            sequenceNo: 2,
            model: "gpt-4.1-mini",
            errorMessage: null,
            createdAt: now,
        },
    ]);

    const activeSession = useMemo(
        () => sessions.find((session) => session.id === activeSessionId) ?? null,
        [activeSessionId, sessions],
    );
    const activeMessages = messages.filter(
        (message) => message.sessionId === activeSessionId,
    );

    function createSession() {
        const createdAt = new Date().toISOString();
        const session: ChatSessionSummary = {
            id: crypto.randomUUID(),
            title: "新的聊天",
            status: "active",
            lastMessageAt: null,
            createdAt,
            updatedAt: createdAt,
        };

        setSessions((current) => [session, ...current]);
        setActiveSessionId(session.id);
    }

    function sendMessage(content: string) {
        const createdAt = new Date().toISOString();
        const targetSessionId = activeSessionId;
        const userMessage: ChatMessageItem = {
            id: crypto.randomUUID(),
            sessionId: targetSessionId,
            role: "user",
            content,
            status: "completed",
            sequenceNo: activeMessages.length + 1,
            model: null,
            errorMessage: null,
            createdAt,
        };

        setMessages((current) => [...current, userMessage]);
        setSessions((current) =>
            current.map((session) =>
                session.id === targetSessionId
                    ? { ...session, lastMessageAt: createdAt, updatedAt: createdAt }
                    : session,
            ),
        );
        setSending(true);
        window.setTimeout(() => {
            const replyAt = new Date().toISOString();
            setMessages((current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    sessionId: targetSessionId,
                    role: "assistant",
                    content: `已收到：**${content}**\n\n后续接入 API 后，这里会展示流式 Markdown 回复。`,
                    status: "completed",
                    sequenceNo: userMessage.sequenceNo + 1,
                    model: "preview",
                    errorMessage: null,
                    createdAt: replyAt,
                },
            ]);
            setSending(false);
        }, 600);
    }

    return {
        activeMessages,
        activeSession,
        createSession,
        selectSession: setActiveSessionId,
        sendMessage,
        sending,
        sessions,
    };
}

export function DashboardPage({ loading, onLogout, user }: DashboardPageProps) {
    const chat = useChatPreview();

    return (
        <ChatLayout
            activeSession={chat.activeSession}
            error={null}
            loadingMessages={false}
            loadingSessions={loading}
            messages={chat.activeMessages}
            onLogout={onLogout}
            onNewSession={chat.createSession}
            onSelectSession={chat.selectSession}
            onSendMessage={chat.sendMessage}
            sending={chat.sending}
            sessions={chat.sessions}
            username={user.username}
        />
    );
}
