import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import type { AuthCredentials, AuthUser } from "@/api/auth";
import {
    getCurrentUser,
    login as loginRequest,
    logout as logoutRequest,
    register as registerRequest,
} from "@/api/auth";
import {
    clearStoredToken,
    getStoredToken,
    storeToken,
} from "@/utils/tokenStorage";

type AuthStatus = "checking" | "anonymous" | "authenticated";
type AuthMode = "login" | "register";

export function useAuth() {
    const [status, setStatus] = useState<AuthStatus>("checking");
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        let ignore = false;
        const token = getStoredToken();

        if (!token) {
            setStatus("anonymous");
            return;
        }

        getCurrentUser(token)
            .then(({ user: currentUser }) => {
                if (ignore) return;
                setUser(currentUser);
                setStatus("authenticated");
            })
            .catch(() => {
                if (ignore) return;
                clearStoredToken();
                setUser(null);
                setStatus("anonymous");
            });

        return () => {
            ignore = true;
        };
    }, []);

    const authenticate = useCallback(
        async (mode: AuthMode, credentials: AuthCredentials) => {
            const request = mode === "login" ? loginRequest : registerRequest;
            const session = await request(credentials);

            storeToken(session.token);
            setUser(session.user);
            setStatus("authenticated");
        },
        [],
    );

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 401) {
                throw error;
            }
        } finally {
            clearStoredToken();
            setUser(null);
            setStatus("anonymous");
        }
    }, []);

    return {
        authenticate,
        logout,
        status,
        user,
    };
}
