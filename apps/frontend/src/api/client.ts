import { API_BASE_URL } from "@/config/env";
import { getStoredToken } from "@/utils/tokenStorage";

type ApiErrorPayload = {
    code: string;
    message: string;
};

type ApiResponse<T> = {
    data: T | null;
    error: ApiErrorPayload | null;
};

type RequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    token?: string | null;
};

export class ApiError extends Error {
    code: string;
    status: number;

    constructor(message: string, code: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.status = status;
    }
}

export async function requestApi<T>(
    path: string,
    { method = "GET", body, token = getStoredToken() }: RequestOptions = {},
) {
    const headers = new Headers({ Accept: "application/json" });

    if (body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = (await readJson<ApiResponse<T>>(response)) ?? {
        data: null,
        error: {
            code: "INVALID_RESPONSE",
            message: "服务响应格式不正确",
        },
    };

    if (payload.error) {
        throw new ApiError(payload.error.message, payload.error.code, response.status);
    }

    if (!response.ok) {
        throw new ApiError("请求失败，请稍后重试", "HTTP_ERROR", response.status);
    }

    if (payload.data === null) {
        throw new ApiError("服务响应缺少数据", "INVALID_RESPONSE", response.status);
    }

    return payload.data;
}

async function readJson<T>(response: Response) {
    try {
        return (await response.json()) as T;
    } catch {
        return null;
    }
}
