import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import {
    createSessionController,
    deleteSessionController,
    listMessagesController,
    listSessionsController,
    sendMessageController,
    updateSessionController
} from "./chat.controller.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get("/sessions", listSessionsController);
chatRouter.post("/sessions", createSessionController);
chatRouter.patch("/sessions/:sessionId", updateSessionController);
chatRouter.delete("/sessions/:sessionId", deleteSessionController);
chatRouter.get("/sessions/:sessionId/messages", listMessagesController);
chatRouter.post("/stream", sendMessageController);
