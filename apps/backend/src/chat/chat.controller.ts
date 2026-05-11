import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { sendError, sendSuccess } from "../http/response.js";
import {
    createFailedAssistantMessage,
    createUserChatMessage,
    createChatSession,
    deleteChatSession,
    generateAssistantChatMessage,
    getSessionMessages,
    getSessions,
    toAiResponseError,
    updateChatSession
} from "./chat.service.js";
import { prepareSse, writeSseEvent } from "./sse.js";

const getUserId = (request: Request) =>
    (request as AuthenticatedRequest).auth.user.id;

const getParam = (request: Request, name: string) => {
    const value = request.params[name];

    return typeof value === "string" ? value : "";
};

export const listSessionsController = async (
    request: Request,
    response: Response
) => {
    try {
        const data = await getSessions(getUserId(request), request.query);

        sendSuccess(response, data);
    } catch (error) {
        sendError(response, error);
    }
};

export const createSessionController = async (
    request: Request,
    response: Response
) => {
    try {
        const data = await createChatSession(getUserId(request), request.body);

        sendSuccess(response, data);
    } catch (error) {
        sendError(response, error);
    }
};

export const updateSessionController = async (
    request: Request,
    response: Response
) => {
    try {
        const data = await updateChatSession(
            getUserId(request),
            getParam(request, "sessionId"),
            request.body
        );

        sendSuccess(response, data);
    } catch (error) {
        sendError(response, error);
    }
};

export const deleteSessionController = async (
    request: Request,
    response: Response
) => {
    try {
        const data = await deleteChatSession(
            getUserId(request),
            getParam(request, "sessionId")
        );

        sendSuccess(response, data);
    } catch (error) {
        sendError(response, error);
    }
};

export const listMessagesController = async (
    request: Request,
    response: Response
) => {
    try {
        const data = await getSessionMessages(
            getUserId(request),
            getParam(request, "sessionId"),
            request.query
        );

        sendSuccess(response, data);
    } catch (error) {
        sendError(response, error);
    }
};

export const sendMessageController = async (
    request: Request,
    response: Response
) => {
    let sessionId: string | null = null;

    try {
        const userId = getUserId(request);
        const data = await createUserChatMessage(userId, request.body);

        sessionId = data.session.id;
        prepareSse(response);
        writeSseEvent(response, "session", data.session);
        writeSseEvent(response, "user_message", data.userMessage);

        try {
            const assistantMessage = await generateAssistantChatMessage(
                userId,
                data.session.id,
                data.historyMessages,
                (content) => {
                    writeSseEvent(response, "assistant_delta", { content });
                }
            );

            writeSseEvent(response, "assistant_message", assistantMessage);
            writeSseEvent(response, "done", { success: true });
        } catch (error) {
            const assistantMessage = await createFailedAssistantMessage(
                userId,
                data.session.id,
                error
            );

            writeSseEvent(response, "error", {
                ...toAiResponseError(error),
                assistantMessage
            });
        }

        response.end();
    } catch (error) {
        if (response.headersSent && sessionId) {
            response.end();
            return;
        }

        sendError(response, error);
    }
};
