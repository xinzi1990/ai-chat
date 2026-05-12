import type { AuthUser } from "@/api/auth";
import { ChatLayout } from "@/components/ChatLayout";
import { useChat } from "@/store/useChat";
import "@/styles/chat.css";
import "@/styles/chat-streaming.css";

type DashboardPageProps = {
    loading: boolean;
    onLogout: () => Promise<void>;
    user: AuthUser;
};

export function DashboardPage({ loading, onLogout, user }: DashboardPageProps) {
    const chat = useChat();

    return (
        <ChatLayout
            activeSession={chat.activeSession}
            error={chat.error}
            loadingMessages={chat.loadingMessages}
            loadingSessions={chat.loadingSessions}
            logoutLoading={loading}
            messages={chat.messages}
            onDeleteSession={chat.removeSession}
            onEditSession={chat.renameSession}
            onLogout={onLogout}
            onNewSession={chat.startNewSession}
            onSelectSession={chat.selectSession}
            onSendMessage={chat.sendMessage}
            sending={chat.sending}
            sessions={chat.sessions}
            username={user.username}
        />
    );
}
