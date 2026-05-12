import { Button, Input } from "antd";
import { useState } from "react";

type ChatComposerProps = {
    disabled: boolean;
    loading: boolean;
    onSend: (content: string) => void;
};

export function ChatComposer({ disabled, loading, onSend }: ChatComposerProps) {
    const [value, setValue] = useState("");
    const submitDisabled = disabled || loading || !value.trim();

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
            <div className="chat-composer__box">
                <Input.TextArea
                    autoSize={{ minRows: 2, maxRows: 5 }}
                    bordered={false}
                    className="chat-composer__input"
                    disabled={disabled || loading}
                    maxLength={4000}
                    onChange={(event) => setValue(event.target.value)}
                    onPressEnter={(event) => {
                        if (!event.shiftKey) {
                            event.preventDefault();
                            submit();
                        }
                    }}
                    placeholder="发消息..."
                    value={value}
                />
                <div className="chat-composer__bar">
                    <span className="chat-composer__hint">
                        Enter 发送，Shift + Enter 换行
                    </span>
                    <Button
                        className="chat-composer__send"
                        disabled={submitDisabled}
                        loading={loading}
                        onClick={submit}
                        shape="circle"
                        type="primary"
                    >
                        ↑
                    </Button>
                </div>
            </div>
        </footer>
    );
}
