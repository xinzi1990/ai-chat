export type ErrorCode =
  | "INVALID_REQUEST"
  | "USERNAME_EXISTS"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
  | "USER_DISABLED"
  | "CHAT_SESSION_NOT_FOUND"
  | "CHAT_SESSION_ARCHIVED"
  | "MESSAGE_TOO_LONG"
  | "AI_RESPONSE_FAILED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
    readonly statusCode: number;
    readonly code: ErrorCode;

    constructor(statusCode: number, code: ErrorCode, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
