import { useState } from "react";
import { App as AntdApp, Spin } from "antd";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { useAuth } from "@/store/useAuth";

export function AppRouter() {
    const { message } = AntdApp.useApp();
    const { authenticate, logout, status, user } = useAuth();
    const [logoutLoading, setLogoutLoading] = useState(false);

    if (status === "checking") {
        return (
            <main className="auth-shell">
                <Spin size="large" tip="正在恢复登录状态" />
            </main>
        );
    }

    if (status === "authenticated" && user) {
        return (
            <DashboardPage
                loading={logoutLoading}
                onLogout={async () => {
                    setLogoutLoading(true);
                    try {
                        await logout();
                        message.success("已退出登录");
                    } catch {
                        message.error("退出登录失败，请稍后重试");
                    } finally {
                        setLogoutLoading(false);
                    }
                }}
                user={user}
            />
        );
    }

    return <AuthPage onAuthenticate={authenticate} />;
}
