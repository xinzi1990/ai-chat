import { ApiError } from "../http/api-error.js";
import type { ChatSessionStatus } from "./types.js";

const idPattern = /^[1-9]\d*$/;
const statuses = new Set<ChatSessionStatus>(["active", "archived"]);

export const assertId = (value: unknown) => {
    if (typeof value !== "string" || !idPattern.test(value)) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    return value;
};

export const parseTitle = (value: unknown, required = false) => {
    if (value === undefined || value === null) {
        if (required) {
            throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
        }

        return undefined;
    }

    const title = typeof value === "string" ? value.trim() : "";

    if (title.length < 1 || title.length > 120) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    return title;
};

export const parseStatus = (value: unknown, defaultValue?: ChatSessionStatus) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (typeof value !== "string" || !statuses.has(value as ChatSessionStatus)) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    return value as ChatSessionStatus;
};

export const parsePage = (value: unknown) => {
    if (value === undefined) {
        return 1;
    }

    const page = Number(value);

    if (!Number.isInteger(page) || page < 1) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    return page;
};

export const parsePageSize = (value: unknown) => {
    if (value === undefined) {
        return 20;
    }

    const pageSize = Number(value);

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    return pageSize;
};

export const parseMessageLimit = (value: unknown) => {
    if (value === undefined) {
        return 50;
    }

    const limit = Number(value);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    return limit;
};

export const parseAfterSequenceNo = (value: unknown) => {
    if (value === undefined) {
        return null;
    }

    const sequenceNo = Number(value);

    if (!Number.isInteger(sequenceNo) || sequenceNo < 0) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    return sequenceNo;
};

export const parseContent = (value: unknown) => {
    const content = typeof value === "string" ? value.trim() : "";

    if (content.length < 1) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    if (content.length > 4000) {
        throw new ApiError(400, "MESSAGE_TOO_LONG", "消息内容超过长度限制");
    }

    return content;
};

export const getBodyRecord = (body: unknown) => {
    if (typeof body !== "object" || body === null) {
        throw new ApiError(400, "INVALID_REQUEST", "请求参数不合法");
    }

    return body as Record<string, unknown>;
};
