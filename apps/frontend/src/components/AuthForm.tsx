import { Button, Form, Input, Tabs } from "antd";
import type { TabsProps } from "antd";
import type { AuthCredentials } from "@/api/auth";

type AuthMode = "login" | "register";

type AuthFormProps = {
  error: string | null;
  loading: boolean;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (mode: AuthMode, credentials: AuthCredentials) => Promise<void>;
};

const modeItems: TabsProps["items"] = [
  { key: "login", label: "登录" },
  { key: "register", label: "注册" },
];

export function AuthForm({
  error,
  loading,
  mode,
  onModeChange,
  onSubmit,
}: AuthFormProps) {
  const [form] = Form.useForm<AuthCredentials>();

  return (
    <>
      <Tabs
        activeKey={mode}
        centered
        items={modeItems}
        onChange={(key) => onModeChange(key as AuthMode)}
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => onSubmit(mode, values)}
        requiredMark={false}
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: "请输入用户名" },
            { min: 3, message: "用户名至少 3 个字符" },
          ]}
          validateStatus={error ? "error" : undefined}
        >
          <Input autoComplete="username" maxLength={64} placeholder="zhangsan" />
        </Form.Item>
        <Form.Item
          extra={error}
          label="密码"
          name="password"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 8, message: "密码至少 8 个字符" },
          ]}
          validateStatus={error ? "error" : undefined}
        >
          <Input.Password
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="至少 8 个字符"
          />
        </Form.Item>
        <Button block htmlType="submit" loading={loading} type="primary">
          {mode === "login" ? "登录" : "注册并登录"}
        </Button>
      </Form>
    </>
  );
}
