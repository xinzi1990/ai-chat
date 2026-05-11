export type SseEvent = {
    event: string;
    data: string;
};

type SseEventHandler = (event: SseEvent) => void | Promise<void>;

export async function readSseStream(
    stream: ReadableStream<Uint8Array>,
    onEvent: SseEventHandler,
) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            buffer = await emitCompleteEvents(buffer, onEvent);
        }

        buffer += decoder.decode();

        if (buffer.trim()) {
            await emitEvent(buffer, onEvent);
        }
    } finally {
        reader.releaseLock();
    }
}

async function emitCompleteEvents(buffer: string, onEvent: SseEventHandler) {
    const normalized = buffer.replace(/\r\n/g, "\n");
    const chunks = normalized.split("\n\n");

    for (const chunk of chunks.slice(0, -1)) {
        if (chunk.trim()) {
            await emitEvent(chunk, onEvent);
        }
    }

    return chunks.at(-1) ?? "";
}

async function emitEvent(chunk: string, onEvent: SseEventHandler) {
    const lines = chunk.replace(/\r\n/g, "\n").split("\n");
    const dataLines: string[] = [];
    let eventName = "message";

    for (const line of lines) {
        if (!line || line.startsWith(":")) continue;

        const separatorIndex = line.indexOf(":");
        const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
        const rawValue = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);
        const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

        if (field === "event") {
            eventName = value;
        }

        if (field === "data") {
            dataLines.push(value);
        }
    }

    await onEvent({
        event: eventName,
        data: dataLines.join("\n"),
    });
}
