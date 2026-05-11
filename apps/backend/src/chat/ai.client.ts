import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { aiConfig } from "../config/ai.js";
import { ApiError } from "../http/api-error.js";
import type { ChatMessage } from "./types.js";

type AssistantReply = {
    content: string;
    model: string;
    promptTokens: number | null;
    completionTokens: number | null;
};

type DeltaHandler = (content: string) => void;

const getModel = () => {
    if (!aiConfig.model) {
        throw new ApiError(500, "AI_RESPONSE_FAILED", "AI 模型未配置");
    }

    return aiConfig.model;
};

const createOpenAiClient = () => {
    if (!aiConfig.openaiApiKey) {
        throw new ApiError(500, "AI_RESPONSE_FAILED", "OpenAI API Key 未配置");
    }

    return new OpenAI({
        apiKey: aiConfig.openaiApiKey,
        baseURL: aiConfig.openaiBaseUrl
    });
};

const toOpenAiMessages = (
    messages: ChatMessage[]
): ChatCompletionMessageParam[] =>
    messages
        .filter((message) => message.status === "completed")
        .map((message) => ({
            role: message.role,
            content: message.content
        }));

const createStubReply = (
    messages: ChatMessage[],
    onDelta: DeltaHandler
): AssistantReply => {
    const lastUserMessage = [...messages]
        .reverse()
        .find((message) => message.role === "user");
    const content = `已收到：${lastUserMessage?.content ?? ""}`;
    const midpoint = Math.max(1, Math.ceil(content.length / 2));
    const chunks = [content.slice(0, midpoint), content.slice(midpoint)].filter(Boolean);

    for (const chunk of chunks) {
        onDelta(chunk);
    }

    return {
        content,
        model: getModel(),
        promptTokens: Math.ceil(messages.map((message) => message.content).join("").length / 4),
        completionTokens: Math.ceil(content.length / 4)
    };
};

const createOpenAiReply = async (
    messages: ChatMessage[],
    onDelta: DeltaHandler
): Promise<AssistantReply> => {
    const model = getModel();
    const client = createOpenAiClient();
    const stream = await client.chat.completions.create({
        model,
        messages: toOpenAiMessages(messages),
        stream: true
    });
    let content = "";

    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta.content ?? "";

        if (delta) {
            content += delta;
            onDelta(delta);
        }
    }

    if (!content) {
        throw new ApiError(502, "AI_RESPONSE_FAILED", "AI 回复生成失败");
    }

    return {
        content,
        model,
        promptTokens: null,
        completionTokens: null
    };
};

export const createAssistantReply = async (
    messages: ChatMessage[],
    onDelta: DeltaHandler
) => {
    if (aiConfig.provider === "stub") {
        return createStubReply(messages, onDelta);
    }

    if (aiConfig.provider !== "openai") {
        throw new ApiError(500, "AI_RESPONSE_FAILED", "AI 提供方未配置");
    }

    return createOpenAiReply(messages, onDelta);
};
