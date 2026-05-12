import {
    Button,
    Dropdown,
    Empty,
    Input,
    List,
    Popconfirm,
    Skeleton,
    Typography,
    type MenuProps,
} from "antd";
import { useState } from "react";
import type { ChatSession } from "@/api/chat";
import { formatSessionTime } from "@/utils/dateTime";

type ChatSidebarProps = {
    activeSessionId: string | null;
    loading: boolean;
    logoutLoading: boolean;
    onDeleteSession: (sessionId: string) => Promise<void>;
    onEditSession: (sessionId: string, title: string) => Promise<void>;
    onLogout: () => Promise<void>;
    onNewSession: () => void;
    onSelectSession: (sessionId: string) => void;
    sessions: ChatSession[];
    username: string;
};

export function ChatSidebar({
    activeSessionId,
    loading,
    logoutLoading,
    onDeleteSession,
    onEditSession,
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
                            <SessionListItem
                                active={session.id === activeSessionId}
                                onDeleteSession={onDeleteSession}
                                onEditSession={onEditSession}
                                onSelectSession={onSelectSession}
                                session={session}
                            />
                        )}
                    />
                ) : (
                    <Empty description="暂无会话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </div>
            <Button danger loading={logoutLoading} onClick={onLogout}>
                退出登录
            </Button>
        </aside>
    );
}

type SessionListItemProps = {
    active: boolean;
    onDeleteSession: (sessionId: string) => Promise<void>;
    onEditSession: (sessionId: string, title: string) => Promise<void>;
    onSelectSession: (sessionId: string) => void;
    session: ChatSession;
};

function SessionListItem({
    active,
    onDeleteSession,
    onEditSession,
    onSelectSession,
    session,
}: SessionListItemProps) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState(session.title);
    const menuItems: MenuProps["items"] = [
        {
            key: "edit",
            label: "编辑标题",
        },
        {
            danger: true,
            key: "delete",
            label: (
                <Popconfirm
                    cancelText="取消"
                    okText="删除"
                    onConfirm={() => onDeleteSession(session.id)}
                    title="删除该会话？"
                >
                    <span>删除会话</span>
                </Popconfirm>
            ),
        },
    ];

    const saveTitle = async () => {
        const nextTitle = title.trim();

        if (!nextTitle || nextTitle === session.title) {
            setEditing(false);
            setTitle(session.title);
            return;
        }

        setSaving(true);
        try {
            await onEditSession(session.id, nextTitle);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    if (editing) {
        return (
            <div className={active ? "chat-session chat-session--active" : "chat-session"}>
                <Input
                    autoFocus
                    disabled={saving}
                    maxLength={120}
                    onChange={(event) => setTitle(event.target.value)}
                    onPressEnter={() => {
                        void saveTitle();
                    }}
                    value={title}
                />
                <div className="chat-session__actions">
                    <Button loading={saving} onClick={() => void saveTitle()} size="small">
                        保存
                    </Button>
                    <Button
                        disabled={saving}
                        onClick={() => {
                            setEditing(false);
                            setTitle(session.title);
                        }}
                        size="small"
                    >
                        取消
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={active ? "chat-session chat-session--active" : "chat-session"}>
            <button
                className="chat-session__content"
                onClick={() => onSelectSession(session.id)}
                type="button"
            >
                <span>{session.title}</span>
                <small>{formatSessionTime(session.lastMessageAt)}</small>
            </button>
            <Dropdown
                menu={{
                    items: menuItems,
                    onClick: ({ domEvent, key }) => {
                        domEvent.stopPropagation();
                        if (key === "edit") {
                            setEditing(true);
                        }
                    },
                }}
                placement="bottomRight"
                trigger={["click"]}
            >
                <Button
                    aria-label="会话操作"
                    className="chat-session__more"
                    onClick={(event) => event.stopPropagation()}
                    size="small"
                    type="text"
                >
                    ⋮
                </Button>
            </Dropdown>
        </div>
    );
}
