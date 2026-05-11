import { Button, Form, Input, Tabs } from "antd";
import type { TabsProps } from "antd";
import type { AuthCredentials } from "@/api/auth";

type AuthMode = "login" | "register";

type AuthFormValues = AuthCredentials & {
    confirmPassword?: string;
};

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
    const [form] = Form.useForm<AuthFormValues>();

    const handleFinish = (values: AuthFormValues) => {
        const credentials: AuthCredentials = {
            username: values.username,
            password: values.password,
        };

        return onSubmit(mode, credentials);
    };

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
                onFinish={handleFinish}
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
                {mode === "register" ? (
                    <Form.Item
                        dependencies={["password"]}
                        label="确认密码"
                        name="confirmPassword"
                        rules={[
                            { required: true, message: "请再次输入密码" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }

                                    return Promise.reject(new Error("两次输入的密码不一致"));
                                },
                            }),
                        ]}
                    >
                        <Input.Password autoComplete="new-password" placeholder="再次输入密码" />
                    </Form.Item>
                ) : null}
                <Button block htmlType="submit" loading={loading} type="primary">
                    {mode === "login" ? "登录" : "注册并登录"}
                </Button>
            </Form>
        </>
    );
}
