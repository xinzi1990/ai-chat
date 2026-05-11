import type { Response } from "express";

import { ApiError } from "./api-error.js";

export const sendSuccess = <T>(response: Response, data: T, statusCode = 200) => {
    response.status(statusCode).json({
        data,
        error: null
    });
};

export const sendError = (
    response: Response,
    error: ApiError | unknown
) => {
    if (error instanceof ApiError) {
        response.status(error.statusCode).json({
            data: null,
            error: {
                code: error.code,
                message: error.message
            }
        });
        return;
    }

    console.error(error);

    response.status(500).json({
        data: null,
        error: {
            code: "INTERNAL_ERROR",
            message: "服务内部错误"
        }
    });
};
