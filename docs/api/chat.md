# AI 聊天接口

本文档记录 AI 聊天相关领域模型和接口。通用响应格式、认证方式、环境变量见 [API 接口总览](../API-DOC.md)。

当前接口为聊天功能第一版设计，用于指导后续实现。所有聊天接口都需要登录态，并通过 `Authorization: Bearer <token>` 传递 JWT。

## 业务错误码

| 错误码                   | 说明                           |
| ------------------------ | ------------------------------ |
| `CHAT_SESSION_NOT_FOUND` | 聊天会话不存在或无权访问       |
| `CHAT_SESSION_ARCHIVED`  | 聊天会话已归档，不能继续发送消息 |
| `MESSAGE_TOO_LONG`       | 消息内容超过长度限制           |
| `AI_RESPONSE_FAILED`     | AI 回复生成失败                |

## 领域模型

### `chat_sessions`

聊天会话表。一个用户可以创建多个会话，每个会话拥有独立的消息上下文。

| 字段              | 类型建议                     | 说明                       |
| ----------------- | ---------------------------- | -------------------------- |
| `id`              | `BIGINT UNSIGNED`            | 会话 ID                    |
| `user_id`         | `BIGINT UNSIGNED`            | 所属用户 ID                |
| `title`           | `VARCHAR(120)`               | 会话标题，可由首条消息生成 |
| `status`          | `ENUM('active', 'archived')` | 会话状态                   |
| `last_message_at` | `DATETIME NULL`              | 最近一条消息时间           |
| `created_at`      | `DATETIME`                   | 创建时间                   |
| `updated_at`      | `DATETIME`                   | 更新时间                   |

建议约束和索引：

- `user_id` 外键关联 `users.id`，用户删除时级联删除会话。
- `idx_chat_sessions_user_id_updated_at (user_id, updated_at)`，用于按用户查询会话列表。
- `idx_chat_sessions_user_id_last_message_at (user_id, last_message_at)`，用于按最近消息排序。

### `chat_messages`

聊天消息表。用户消息和 AI 回复都记录在同一张表中，通过 `role` 区分。

| 字段                | 类型建议                      | 说明              |
| ------------------- | ----------------------------- | ----------------- |
| `id`                | `BIGINT UNSIGNED`             | 消息 ID           |
| `session_id`        | `BIGINT UNSIGNED`             | 所属会话 ID       |
| `user_id`           | `BIGINT UNSIGNED`             | 所属用户 ID       |
| `role`              | `ENUM('user', 'assistant')`   | 消息角色          |
| `content`           | `MEDIUMTEXT`                  | 消息正文          |
| `status`            | `ENUM('completed', 'failed')` | 消息状态          |
| `sequence_no`       | `INT UNSIGNED`                | 会话内递增序号    |
| `model`             | `VARCHAR(64) NULL`            | AI 回复使用的模型 |
| `prompt_tokens`     | `INT UNSIGNED NULL`           | 输入 token 数     |
| `completion_tokens` | `INT UNSIGNED NULL`           | 输出 token 数     |
| `error_message`     | `VARCHAR(500) NULL`           | AI 回复失败原因   |
| `created_at`        | `DATETIME`                    | 创建时间          |

建议约束和索引：

- `session_id` 外键关联 `chat_sessions.id`，会话删除时级联删除消息。
- `user_id` 外键关联 `users.id`，用户删除时级联删除消息。
- `uk_chat_messages_session_sequence (session_id, sequence_no)`，保证会话内消息顺序唯一。
- `idx_chat_messages_session_id_created_at (session_id, created_at)`，用于查询会话消息。
- `idx_chat_messages_user_id_created_at (user_id, created_at)`，用于按用户查询消息。

## 通用数据结构

### `ChatSession`

```json
{
  "id": "1",
  "title": "帮我设计登录页面",
  "status": "active",
  "lastMessageAt": "2026-05-11T10:20:30.000Z",
  "createdAt": "2026-05-11T10:10:00.000Z",
  "updatedAt": "2026-05-11T10:20:30.000Z"
}
```

### `ChatMessage`

```json
{
  "id": "1",
  "sessionId": "1",
  "role": "user",
  "content": "帮我设计一个登录页面",
  "status": "completed",
  "sequenceNo": 1,
  "model": null,
  "promptTokens": null,
  "completionTokens": null,
  "errorMessage": null,
  "createdAt": "2026-05-11T10:10:00.000Z"
}
```

## `GET /api/chat/sessions`

查询当前用户的聊天会话列表，默认按 `lastMessageAt` 倒序排列。无消息会话按 `updatedAt` 倒序排列。

### 请求头

```http
Authorization: Bearer <token>
```

### 查询参数

| 参数       | 类型     | 必填 | 默认值   | 说明                         |
| ---------- | -------- | ---- | -------- | ---------------------------- |
| `status`   | `string` | 否   | `active` | 可选值：`active`、`archived` |
| `page`     | `number` | 否   | `1`      | 页码，从 1 开始              |
| `pageSize` | `number` | 否   | `20`     | 每页数量，最大 50            |

### 成功响应

```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "title": "帮我设计登录页面",
        "status": "active",
        "lastMessageAt": "2026-05-11T10:20:30.000Z",
        "createdAt": "2026-05-11T10:10:00.000Z",
        "updatedAt": "2026-05-11T10:20:30.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  },
  "error": null
}
```

### 错误响应

| HTTP 状态码 | 错误码            | 说明                |
| ----------- | ----------------- | ------------------- |
| `400`       | `INVALID_REQUEST` | 请求参数不合法      |
| `401`       | `UNAUTHORIZED`    | 未登录或 token 无效 |
| `403`       | `USER_DISABLED`   | 用户已被禁用        |

## `POST /api/chat/sessions`

创建一个空聊天会话。也可以不调用该接口，直接通过 `POST /api/chat/messages` 发送首条消息并自动创建会话。

### 请求头

```http
Authorization: Bearer <token>
```

### 请求体

| 字段    | 类型     | 必填 | 说明                         |
| ------- | -------- | ---- | ---------------------------- |
| `title` | `string` | 否   | 会话标题，不传时使用默认标题 |

### 请求示例

```json
{
  "title": "新的聊天"
}
```

### 成功响应

```json
{
  "data": {
    "session": {
      "id": "1",
      "title": "新的聊天",
      "status": "active",
      "lastMessageAt": null,
      "createdAt": "2026-05-11T10:10:00.000Z",
      "updatedAt": "2026-05-11T10:10:00.000Z"
    }
  },
  "error": null
}
```

### 错误响应

| HTTP 状态码 | 错误码            | 说明                |
| ----------- | ----------------- | ------------------- |
| `400`       | `INVALID_REQUEST` | 请求参数不合法      |
| `401`       | `UNAUTHORIZED`    | 未登录或 token 无效 |
| `403`       | `USER_DISABLED`   | 用户已被禁用        |

## `PATCH /api/chat/sessions/:sessionId`

更新当前用户的聊天会话。首版支持修改标题和归档状态。

### 请求头

```http
Authorization: Bearer <token>
```

### 路径参数

| 参数        | 类型     | 必填 | 说明    |
| ----------- | -------- | ---- | ------- |
| `sessionId` | `string` | 是   | 会话 ID |

### 请求体

| 字段     | 类型     | 必填 | 说明                         |
| -------- | -------- | ---- | ---------------------------- |
| `title`  | `string` | 否   | 新会话标题                   |
| `status` | `string` | 否   | 可选值：`active`、`archived` |

### 请求示例

```json
{
  "title": "登录页设计方案",
  "status": "active"
}
```

### 成功响应

```json
{
  "data": {
    "session": {
      "id": "1",
      "title": "登录页设计方案",
      "status": "active",
      "lastMessageAt": "2026-05-11T10:20:30.000Z",
      "createdAt": "2026-05-11T10:10:00.000Z",
      "updatedAt": "2026-05-11T10:30:00.000Z"
    }
  },
  "error": null
}
```

### 错误响应

| HTTP 状态码 | 错误码                   | 说明                       |
| ----------- | ------------------------ | -------------------------- |
| `400`       | `INVALID_REQUEST`        | 请求参数不合法             |
| `401`       | `UNAUTHORIZED`           | 未登录或 token 无效        |
| `403`       | `USER_DISABLED`          | 用户已被禁用               |
| `404`       | `CHAT_SESSION_NOT_FOUND` | 会话不存在或不属于当前用户 |

## `DELETE /api/chat/sessions/:sessionId`

删除当前用户的聊天会话。删除会话会同时删除该会话下的历史消息；如果只是从默认列表隐藏会话，应使用 `PATCH /api/chat/sessions/:sessionId` 将会话状态更新为 `archived`。

### 请求头

```http
Authorization: Bearer <token>
```

### 路径参数

| 参数        | 类型     | 必填 | 说明    |
| ----------- | -------- | ---- | ------- |
| `sessionId` | `string` | 是   | 会话 ID |

### 成功响应

```json
{
  "data": {
    "success": true
  },
  "error": null
}
```

### 错误响应

| HTTP 状态码 | 错误码                   | 说明                       |
| ----------- | ------------------------ | -------------------------- |
| `400`       | `INVALID_REQUEST`        | 请求参数不合法             |
| `401`       | `UNAUTHORIZED`           | 未登录或 token 无效        |
| `403`       | `USER_DISABLED`          | 用户已被禁用               |
| `404`       | `CHAT_SESSION_NOT_FOUND` | 会话不存在或不属于当前用户 |

## `GET /api/chat/sessions/:sessionId/messages`

查询当前用户指定会话的历史消息，默认按 `sequenceNo` 升序排列。

### 请求头

```http
Authorization: Bearer <token>
```

### 路径参数

| 参数        | 类型     | 必填 | 说明    |
| ----------- | -------- | ---- | ------- |
| `sessionId` | `string` | 是   | 会话 ID |

### 查询参数

| 参数              | 类型     | 必填 | 默认值 | 说明                   |
| ----------------- | -------- | ---- | ------ | ---------------------- |
| `afterSequenceNo` | `number` | 否   | 无     | 只查询该序号之后的消息 |
| `limit`           | `number` | 否   | `50`   | 返回数量，最大 100     |

### 成功响应

```json
{
  "data": {
    "session": {
      "id": "1",
      "title": "帮我设计登录页面",
      "status": "active",
      "lastMessageAt": "2026-05-11T10:20:30.000Z",
      "createdAt": "2026-05-11T10:10:00.000Z",
      "updatedAt": "2026-05-11T10:20:30.000Z"
    },
    "items": [
      {
        "id": "1",
        "sessionId": "1",
        "role": "user",
        "content": "帮我设计一个登录页面",
        "status": "completed",
        "sequenceNo": 1,
        "model": null,
        "promptTokens": null,
        "completionTokens": null,
        "errorMessage": null,
        "createdAt": "2026-05-11T10:10:00.000Z"
      },
      {
        "id": "2",
        "sessionId": "1",
        "role": "assistant",
        "content": "可以，先确认登录方式和目标用户。",
        "status": "completed",
        "sequenceNo": 2,
        "model": "gpt-4.1-mini",
        "promptTokens": 120,
        "completionTokens": 42,
        "errorMessage": null,
        "createdAt": "2026-05-11T10:20:30.000Z"
      }
    ],
    "hasMore": false
  },
  "error": null
}
```

### 错误响应

| HTTP 状态码 | 错误码                   | 说明                       |
| ----------- | ------------------------ | -------------------------- |
| `400`       | `INVALID_REQUEST`        | 请求参数不合法             |
| `401`       | `UNAUTHORIZED`           | 未登录或 token 无效        |
| `403`       | `USER_DISABLED`          | 用户已被禁用               |
| `404`       | `CHAT_SESSION_NOT_FOUND` | 会话不存在或不属于当前用户 |

## `POST /api/chat/messages`

发送用户消息并通过 SSE 流式生成 AI 回复。`sessionId` 为空时，服务端自动创建新会话；`sessionId` 存在时，消息追加到指定会话。

接口在完成请求参数校验、登录态校验和会话权限校验后，返回 `text/event-stream`。进入 SSE 流后，服务端按事件持续推送会话、用户消息、AI 增量内容、最终 AI 消息和结束状态。

### 请求头

```http
Authorization: Bearer <token>
Accept: text/event-stream
```

### 请求体

| 字段        | 类型     | 必填 | 说明                         |
| ----------- | -------- | ---- | ---------------------------- |
| `sessionId` | `string` | 否   | 会话 ID，不传则创建新会话    |
| `content`   | `string` | 是   | 用户消息内容，最大 4000 字符 |

### 请求示例

```json
{
  "sessionId": "1",
  "content": "帮我把这个方案拆成三个步骤"
}
```

新会话首条消息示例：

```json
{
  "content": "帮我设计一个登录页面"
}
```

### SSE 响应头

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
```

### SSE 事件

| 事件名              | 说明                              |
| ------------------- | --------------------------------- |
| `session`           | 会话信息。新会话自动创建后先推送 |
| `user_message`      | 已保存的用户消息                  |
| `assistant_delta`   | AI 回复增量文本                   |
| `assistant_message` | 已保存的完整 AI 回复消息          |
| `done`              | 本次回复结束                      |
| `error`             | AI 回复生成失败                   |

### SSE 成功响应示例

```text
event: session
data: {"id":"1","title":"帮我设计一个登录页面","status":"active","lastMessageAt":"2026-05-11T10:20:30.000Z","createdAt":"2026-05-11T10:10:00.000Z","updatedAt":"2026-05-11T10:20:30.000Z"}

event: user_message
data: {"id":"1","sessionId":"1","role":"user","content":"帮我设计一个登录页面","status":"completed","sequenceNo":1,"model":null,"promptTokens":null,"completionTokens":null,"errorMessage":null,"createdAt":"2026-05-11T10:10:00.000Z"}

event: assistant_delta
data: {"content":"可以，"}

event: assistant_delta
data: {"content":"先确认登录方式和目标用户。"}

event: assistant_message
data: {"id":"2","sessionId":"1","role":"assistant","content":"可以，先确认登录方式和目标用户。","status":"completed","sequenceNo":2,"model":"gpt-4.1-mini","promptTokens":120,"completionTokens":42,"errorMessage":null,"createdAt":"2026-05-11T10:20:30.000Z"}

event: done
data: {"success":true}
```

### SSE 失败响应示例

如果用户消息已经保存，但 AI 回复生成失败，服务端应保存一条 `role = "assistant"`、`status = "failed"` 的失败消息，并通过 SSE `error` 事件返回失败信息。

```text
event: error
data: {"code":"AI_RESPONSE_FAILED","message":"AI 回复生成失败","assistantMessage":{"id":"2","sessionId":"1","role":"assistant","content":"","status":"failed","sequenceNo":2,"model":"gpt-4.1-mini","promptTokens":null,"completionTokens":null,"errorMessage":"AI response failed","createdAt":"2026-05-11T10:20:30.000Z"}}
```

进入 SSE 流之前发生的参数校验、认证、权限、会话状态错误，仍按通用 JSON 错误响应返回。

### 进入 SSE 前的错误响应

| HTTP 状态码 | 错误码                   | 说明                         |
| ----------- | ------------------------ | ---------------------------- |
| `400`       | `INVALID_REQUEST`        | 请求参数不合法               |
| `400`       | `MESSAGE_TOO_LONG`       | 消息内容超过长度限制         |
| `401`       | `UNAUTHORIZED`           | 未登录或 token 无效          |
| `403`       | `USER_DISABLED`          | 用户已被禁用                 |
| `404`       | `CHAT_SESSION_NOT_FOUND` | 会话不存在或不属于当前用户   |
| `409`       | `CHAT_SESSION_ARCHIVED`  | 会话已归档，不能继续发送消息 |
