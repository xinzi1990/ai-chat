const appTimeZone = "Asia/Shanghai";

export function formatChatTime(value: string) {
    return new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: appTimeZone,
    }).format(new Date(value));
}

export function formatSessionTime(value: string | null) {
    if (!value) {
        return "暂无消息";
    }

    return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: appTimeZone,
    }).format(new Date(value));
}
