import { requestApi } from "@/api/client";

export type AuthUser = {
    id: string;
    username: string;
};

export type AuthCredentials = {
    username: string;
    password: string;
};

type AuthSessionResponse = {
    user: AuthUser;
    token: string;
};

type CurrentUserResponse = {
    user: AuthUser;
};

type LogoutResponse = {
    success: boolean;
};

export function register(credentials: AuthCredentials) {
    return requestApi<AuthSessionResponse>("/api/auth/register", {
        method: "POST",
        body: credentials,
    });
}

export function login(credentials: AuthCredentials) {
    return requestApi<AuthSessionResponse>("/api/auth/login", {
        method: "POST",
        body: credentials,
    });
}

export function getCurrentUser(token: string) {
    return requestApi<CurrentUserResponse>("/api/auth/me", { token });
}

export function logout() {
    return requestApi<LogoutResponse>("/api/auth/logout", { method: "POST" });
}
