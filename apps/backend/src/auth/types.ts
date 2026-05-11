import type { RowDataPacket } from "mysql2";

export type UserStatus = "active" | "disabled";

export type User = {
    id: string;
    username: string;
    passwordHash: string;
    status: UserStatus;
};

export type PublicUser = {
    id: string;
    username: string;
};

export type UserRow = RowDataPacket & {
    id: string | number | bigint;
    username: string;
    password_hash: string;
    status: UserStatus;
};

export type JwtPayload = {
    sub: string;
    username: string;
    jti: string;
    iat: number;
    exp: number;
};
