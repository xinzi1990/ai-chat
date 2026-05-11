const DEFAULT_JWT_EXPIRES_IN_DAYS = 7;

export type AuthConfig = {
    jwtSecret: string;
    jwtExpiresInDays: number;
};

const parsePositiveNumber = (value: string | undefined, fallback: number) => {
    if (value === undefined) {
        return fallback;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const authConfig: AuthConfig = {
    jwtSecret: process.env.JWT_SECRET ?? "replace-with-local-secret",
    jwtExpiresInDays: parsePositiveNumber(
        process.env.JWT_EXPIRES_IN_DAYS,
        DEFAULT_JWT_EXPIRES_IN_DAYS
    )
};
