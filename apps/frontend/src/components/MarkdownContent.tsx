import type { ReactNode } from "react";

type MarkdownContentProps = {
    content: string;
};

function renderInline(text: string): ReactNode[] {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={index}>{part.slice(1, -1)}</code>;
        }

        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }

        return part;
    });
}

export function MarkdownContent({ content }: MarkdownContentProps) {
    const blocks: ReactNode[] = [];
    const lines = content.split("\n");
    let codeLines: string[] = [];
    let listItems: string[] = [];
    let inCodeBlock = false;

    const flushList = () => {
        if (listItems.length === 0) {
            return;
        }

        blocks.push(
            <ul key={`list-${blocks.length}`}>
                {listItems.map((item, index) => (
                    <li key={`${item}-${index}`}>{renderInline(item)}</li>
                ))}
            </ul>,
        );
        listItems = [];
    };

    const flushCode = () => {
        blocks.push(
            <pre key={`code-${blocks.length}`}>
                <code>{codeLines.join("\n")}</code>
            </pre>,
        );
        codeLines = [];
    };

    lines.forEach((line) => {
        if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
                flushCode();
            } else {
                flushList();
            }
            inCodeBlock = !inCodeBlock;
            return;
        }

        if (inCodeBlock) {
            codeLines.push(line);
            return;
        }

        const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            const Heading = `h${level + 2}` as "h3" | "h4" | "h5";
            blocks.push(
                <Heading key={`heading-${blocks.length}`}>
                    {renderInline(headingMatch[2])}
                </Heading>,
            );
            return;
        }

        const listMatch = /^[-*]\s+(.+)$/.exec(line);
        if (listMatch) {
            listItems.push(listMatch[1]);
            return;
        }

        flushList();
        if (line.trim()) {
            blocks.push(<p key={`p-${blocks.length}`}>{renderInline(line)}</p>);
        }
    });

    if (inCodeBlock || codeLines.length > 0) {
        flushCode();
    }
    flushList();

    return <div className="chat-markdown">{blocks}</div>;
}
