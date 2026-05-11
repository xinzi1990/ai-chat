import type { Request, Response } from "express";

import { sendError, sendSuccess } from "../http/response.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import { login, logout, register } from "./auth.service.js";
import { toPublicUser } from "./user-mapper.js";

export const registerController = async (request: Request, response: Response) => {
    try {
        const data = await register(request.body);

        sendSuccess(response, data);
    } catch (error) {
        sendError(response, error);
    }
};

export const loginController = async (request: Request, response: Response) => {
    try {
        const data = await login(request.body);

        sendSuccess(response, data);
    } catch (error) {
        sendError(response, error);
    }
};

export const meController = (request: Request, response: Response) => {
    const { auth } = request as AuthenticatedRequest;

    sendSuccess(response, {
        user: toPublicUser(auth.user)
    });
};

export const logoutController = async (request: Request, response: Response) => {
    try {
        const { auth } = request as AuthenticatedRequest;
        const data = await logout(auth.payload);

        sendSuccess(response, data);
    } catch (error) {
        sendError(response, error);
    }
};
