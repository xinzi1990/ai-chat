import { Alert, Empty, Skeleton, Spin, Typography } from "antd";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { ChatMessageItem } from "@/pages/DashboardPage";

type ChatMessagesProps = {
    error: string | null;
    loading: boolean;
    messages: ChatMessageItem[];
    sending: boolean;
};

function formatMessageTime(value: string) {
    return new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export function ChatMessages({
    error,
    loading,
    messages,
    sending,
}: ChatMessagesProps) {
    if (loading) {
        return (
            <div className="chat-messages chat-messages--state">
                <Skeleton active paragraph={{ rows: 8 }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="chat-messages chat-messages--state">
                <Alert message={error} showIcon type="error" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="chat-messages chat-messages--state">
                <Empty description="选择会话或发送第一条消息" />
            </div>
        );
    }

    return (
        <div className="chat-messages">
            {messages.map((message) => (
                <article
                    className={
                        message.role === "user"
                            ? "chat-message chat-message--user"
                            : "chat-message chat-message--assistant"
                    }
                    key={message.id}
                >
                    <div className="chat-message__meta">
                        <Typography.Text strong>
                            {message.role === "user" ? "你" : "AI"}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                            {formatMessageTime(message.createdAt)}
                        </Typography.Text>
                    </div>
                    <div className="chat-message__bubble">
                        {message.role === "assistant" ? (
                            <MarkdownContent content={message.content} />
                        ) : (
                            <p>{message.content}</p>
                        )}
                        {message.status === "failed" && message.errorMessage ? (
                            <Alert message={message.errorMessage} showIcon type="error" />
                        ) : null}
                    </div>
                </article>
            ))}
            {sending ? (
                <div className="chat-streaming">
                    <Spin size="small" />
                    <span>AI 正在回复</span>
                </div>
            ) : null}
        </div>
    );
}
