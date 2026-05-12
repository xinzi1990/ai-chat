import { Typography } from "antd";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatSidebar } from "@/components/ChatSidebar";
import type { ChatMessage, ChatSession } from "@/api/chat";

type ChatLayoutProps = {
    activeSession: ChatSession | null;
    error: string | null;
    loadingMessages: boolean;
    loadingSessions: boolean;
    logoutLoading: boolean;
    messages: ChatMessage[];
    onDeleteSession: (sessionId: string) => Promise<void>;
    onEditSession: (sessionId: string, title: string) => Promise<void>;
    onLogout: () => Promise<void>;
    onNewSession: () => void;
    onSelectSession: (sessionId: string) => void;
    onSendMessage: (content: string) => void;
    sending: boolean;
    sessions: ChatSession[];
    username: string;
};

export function ChatLayout({
    activeSession,
    error,
    loadingMessages,
    loadingSessions,
    logoutLoading,
    messages,
    onDeleteSession,
    onEditSession,
    onLogout,
    onNewSession,
    onSelectSession,
    onSendMessage,
    sending,
    sessions,
    username,
}: ChatLayoutProps) {
    return (
        <main className="chat-shell">
            <ChatSidebar
                activeSessionId={activeSession?.id ?? null}
                loading={loadingSessions}
                logoutLoading={logoutLoading}
                onDeleteSession={onDeleteSession}
                onEditSession={onEditSession}
                onLogout={onLogout}
                onNewSession={onNewSession}
                onSelectSession={onSelectSession}
                sessions={sessions}
                username={username}
            />
            <section className="chat-main">
                <header className="chat-header">
                    <div>
                        <Typography.Title level={1}>
                            {activeSession?.title ?? "新的聊天"}
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            {activeSession
                                ? "上下文会随当前会话连续保存"
                                : "发送消息后将创建新会话"}
                        </Typography.Text>
                    </div>
                </header>
                <ChatMessages
                    error={error}
                    loading={loadingMessages}
                    messages={messages}
                    sending={sending}
                />
                <ChatComposer
                    disabled={loadingMessages}
                    loading={sending}
                    onSend={onSendMessage}
                />
            </section>
        </main>
    );
}
