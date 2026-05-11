import { Button, Empty, List, Skeleton, Typography } from "antd";
import type { ChatSessionSummary } from "@/pages/DashboardPage";

type ChatSidebarProps = {
    activeSessionId: string | null;
    loading: boolean;
    onLogout: () => Promise<void>;
    onNewSession: () => void;
    onSelectSession: (sessionId: string) => void;
    sessions: ChatSessionSummary[];
    username: string;
};

function formatSessionTime(value: string | null) {
    if (!value) {
        return "暂无消息";
    }

    return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export function ChatSidebar({
    activeSessionId,
    loading,
    onLogout,
    onNewSession,
    onSelectSession,
    sessions,
    username,
}: ChatSidebarProps) {
    return (
        <aside className="chat-sidebar">
            <div className="chat-sidebar__brand">
                <Typography.Title level={2}>AI Chat</Typography.Title>
                <Typography.Text type="secondary">{username}</Typography.Text>
            </div>
            <Button block type="primary" onClick={onNewSession}>
                新会话
            </Button>
            <div className="chat-sidebar__sessions">
                {loading ? (
                    <Skeleton active paragraph={{ rows: 8 }} title={false} />
                ) : sessions.length > 0 ? (
                    <List
                        dataSource={sessions}
                        renderItem={(session) => (
                            <button
                                className={
                                    session.id === activeSessionId
                                        ? "chat-session chat-session--active"
                                        : "chat-session"
                                }
                                onClick={() => onSelectSession(session.id)}
                                type="button"
                            >
                                <span>{session.title}</span>
                                <small>{formatSessionTime(session.lastMessageAt)}</small>
                            </button>
                        )}
                    />
                ) : (
                    <Empty description="暂无会话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </div>
            <Button danger loading={loading} onClick={onLogout}>
                退出登录
            </Button>
        </aside>
    );
}
