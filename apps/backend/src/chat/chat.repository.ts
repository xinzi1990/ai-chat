import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";

import { mysqlPool } from "../db/pool.js";
import { mapMessageRow, mapSessionRow } from "./chat.mapper.js";
import type {
    ChatMessageRole,
    ChatMessageStatus,
    ChatSession,
    ChatMessageRow,
    ChatSessionRow,
    ChatSessionStatus
} from "./types.js";

type CountRow = RowDataPacket & {
    total: number;
};

type NextSequenceRow = RowDataPacket & {
    next_sequence_no: number;
};

type MessageInput = {
    role: ChatMessageRole;
    content: string;
    status?: ChatMessageStatus;
    model?: string | null;
    promptTokens?: number | null;
    completionTokens?: number | null;
    errorMessage?: string | null;
};

export const findSessionById = async (userId: string, sessionId: string) => {
    const [rows] = await mysqlPool.execute<ChatSessionRow[]>(
        `SELECT id, user_id, title, status, last_message_at, created_at, updated_at
       FROM chat_sessions
      WHERE id = ? AND user_id = ?
      LIMIT 1`,
        [sessionId, userId]
    );

    return rows[0] ? mapSessionRow(rows[0]) : null;
};

export const listSessions = async (
    userId: string,
    status: ChatSessionStatus,
    page: number,
    pageSize: number
) => {
    const offset = (page - 1) * pageSize;
    const [rows] = await mysqlPool.execute<ChatSessionRow[]>(
        `SELECT id, user_id, title, status, last_message_at, created_at, updated_at
       FROM chat_sessions
      WHERE user_id = ? AND status = ?
      ORDER BY COALESCE(last_message_at, updated_at) DESC, id DESC
      LIMIT ${pageSize} OFFSET ${offset}`,
        [userId, status]
    );
    const [countRows] = await mysqlPool.execute<CountRow[]>(
        `SELECT COUNT(*) AS total
       FROM chat_sessions
      WHERE user_id = ? AND status = ?`,
        [userId, status]
    );

    return {
        items: rows.map(mapSessionRow),
        total: Number(countRows[0]?.total ?? 0)
    };
};

export const createSession = async (userId: string, title: string) => {
    const [result] = await mysqlPool.execute<ResultSetHeader>(
        `INSERT INTO chat_sessions (user_id, title, status)
     VALUES (?, ?, 'active')`,
        [userId, title]
    );
    const session = await findSessionById(userId, String(result.insertId));

    if (!session) {
        throw new Error("Created chat session not found");
    }

    return session;
};

export const updateSession = async (
    userId: string,
    sessionId: string,
    fields: { title?: string; status?: ChatSessionStatus }
) => {
    await mysqlPool.execute(
        `UPDATE chat_sessions
        SET title = COALESCE(?, title),
            status = COALESCE(?, status)
      WHERE id = ? AND user_id = ?`,
        [fields.title ?? null, fields.status ?? null, sessionId, userId]
    );

    return findSessionById(userId, sessionId);
};

export const deleteSession = async (userId: string, sessionId: string) => {
    const [result] = await mysqlPool.execute<ResultSetHeader>(
        `DELETE FROM chat_sessions
      WHERE id = ? AND user_id = ?`,
        [sessionId, userId]
    );

    return result.affectedRows > 0;
};

export const listMessages = async (
    userId: string,
    sessionId: string,
    afterSequenceNo: number | null,
    limit: number
) => {
    const queryLimit = limit + 1;
    const [rows] = await mysqlPool.execute<ChatMessageRow[]>(
        `SELECT id, session_id, user_id, role, content, status, sequence_no,
              model, prompt_tokens, completion_tokens, error_message, created_at
       FROM chat_messages
      WHERE user_id = ? AND session_id = ? AND sequence_no > ?
      ORDER BY sequence_no ASC
      LIMIT ${queryLimit}`,
        [userId, sessionId, afterSequenceNo ?? 0]
    );

    return {
        items: rows.slice(0, limit).map(mapMessageRow),
        hasMore: rows.length > limit
    };
};

export const listAllCompletedMessages = async (
    userId: string,
    sessionId: string
) => {
    const [rows] = await mysqlPool.execute<ChatMessageRow[]>(
        `SELECT id, session_id, user_id, role, content, status, sequence_no,
              model, prompt_tokens, completion_tokens, error_message, created_at
       FROM chat_messages
      WHERE user_id = ? AND session_id = ? AND status = 'completed'
      ORDER BY sequence_no ASC`,
        [userId, sessionId]
    );

    return rows.map(mapMessageRow);
};

const insertMessage = async (
    connection: PoolConnection,
    userId: string,
    sessionId: string,
    sequenceNo: number,
    input: MessageInput
) => {
    const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO chat_messages
            (session_id, user_id, role, content, status, sequence_no, model,
             prompt_tokens, completion_tokens, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            sessionId,
            userId,
            input.role,
            input.content,
            input.status ?? "completed",
            sequenceNo,
            input.model ?? null,
            input.promptTokens ?? null,
            input.completionTokens ?? null,
            input.errorMessage ?? null
        ]
    );
    const [rows] = await connection.execute<ChatMessageRow[]>(
        `SELECT id, session_id, user_id, role, content, status, sequence_no,
              model, prompt_tokens, completion_tokens, error_message, created_at
       FROM chat_messages
      WHERE id = ?
      LIMIT 1`,
        [result.insertId]
    );

    return mapMessageRow(rows[0]);
};

export const appendMessage = async (
    userId: string,
    session: ChatSession,
    input: MessageInput
) => {
    const connection = await mysqlPool.getConnection();

    try {
        await connection.beginTransaction();
        await connection.execute(
            `SELECT id FROM chat_sessions
          WHERE id = ? AND user_id = ?
          FOR UPDATE`,
            [session.id, userId]
        );
        const [sequenceRows] = await connection.execute<NextSequenceRow[]>(
            `SELECT COALESCE(MAX(sequence_no), 0) + 1 AS next_sequence_no
           FROM chat_messages
          WHERE session_id = ?`,
            [session.id]
        );
        const sequenceNo = Number(sequenceRows[0]?.next_sequence_no ?? 1);
        const message = await insertMessage(
            connection,
            userId,
            session.id,
            sequenceNo,
            input
        );

        await connection.execute(
            `UPDATE chat_sessions
            SET last_message_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?`,
            [session.id, userId]
        );
        await connection.commit();

        return message;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
