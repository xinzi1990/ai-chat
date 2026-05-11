import { Button, Space, Typography } from "antd";
import type { AuthUser } from "@/api/auth";

type DashboardPageProps = {
  loading: boolean;
  onLogout: () => Promise<void>;
  user: AuthUser;
};

export function DashboardPage({ loading, onLogout, user }: DashboardPageProps) {
  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--center">
        <Space direction="vertical" size={20} align="center">
          <Typography.Title level={1}>AI Chat</Typography.Title>
          <div>
            <Typography.Text type="secondary">当前用户</Typography.Text>
            <Typography.Title level={2}>{user.username}</Typography.Title>
            <Typography.Text type="secondary">用户 ID：{user.id}</Typography.Text>
          </div>
          <Button danger loading={loading} onClick={onLogout}>
            退出登录
          </Button>
        </Space>
      </section>
    </main>
  );
}
