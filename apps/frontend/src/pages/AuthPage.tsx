import { useState } from "react";
import { App as AntdApp, Typography } from "antd";
import { ApiError } from "@/api/client";
import type { AuthCredentials } from "@/api/auth";
import { AuthForm } from "@/components/AuthForm";

type AuthMode = "login" | "register";

type AuthPageProps = {
  onAuthenticate: (
    mode: AuthMode,
    credentials: AuthCredentials,
  ) => Promise<void>;
};

export function AuthPage({ onAuthenticate }: AuthPageProps) {
  const { message } = AntdApp.useApp();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    nextMode: AuthMode,
    credentials: AuthCredentials,
  ) {
    setError(null);
    setLoading(true);

    try {
      await onAuthenticate(nextMode, credentials);
      message.success(nextMode === "login" ? "登录成功" : "注册成功");
    } catch (caught) {
      const nextError =
        caught instanceof ApiError ? caught.message : "请求失败，请稍后重试";
      setError(nextError);
      message.error(nextError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Typography.Title level={1}>AI Chat</Typography.Title>
        <Typography.Paragraph type="secondary">
          使用用户名和密码登录，或创建新账号开始使用。
        </Typography.Paragraph>
        <AuthForm
          error={error}
          loading={loading}
          mode={mode}
          onModeChange={(nextMode) => {
            setMode(nextMode);
            setError(null);
          }}
          onSubmit={handleSubmit}
        />
      </section>
    </main>
  );
}
