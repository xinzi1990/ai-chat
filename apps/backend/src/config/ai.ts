export type AiProvider = "openai" | "stub";

const parseProvider = (value: string | undefined) => {
    if (value === "openai" || value === "stub") {
        return value;
    }

    return null;
};

export const aiConfig = {
    provider: parseProvider(process.env.AI_PROVIDER),
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    openaiBaseUrl: process.env.OPENAI_BASE_URL || undefined,
    model: process.env.OPENAI_MODEL ?? "",
};
