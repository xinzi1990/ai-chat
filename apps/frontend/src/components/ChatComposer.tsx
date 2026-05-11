import { Button, Input } from "antd";
import { useState } from "react";

type ChatComposerProps = {
    disabled: boolean;
    loading: boolean;
    onSend: (content: string) => void;
};

export function ChatComposer({ disabled, loading, onSend }: ChatComposerProps) {
    const [value, setValue] = useState("");

    const submit = () => {
        const content = value.trim();
        if (!content) {
            return;
        }

        onSend(content);
        setValue("");
    };

    return (
        <footer className="chat-composer">
            <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 5 }}
                disabled={disabled || loading}
                maxLength={4000}
                onChange={(event) => setValue(event.target.value)}
                onPressEnter={(event) => {
                    if (!event.shiftKey) {
                        event.preventDefault();
                        submit();
                    }
                }}
                placeholder="输入消息，Enter 发送，Shift + Enter 换行"
                showCount
                value={value}
            />
            <Button
                disabled={disabled || !value.trim()}
                loading={loading}
                onClick={submit}
                type="primary"
            >
                发送
            </Button>
        </footer>
    );
}
