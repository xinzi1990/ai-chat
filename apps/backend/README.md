# Backend

Node.js + Express + TypeScript 后端服务，使用 `mysql2` 连接 MySQL，提供健康检查、JWT 用户认证 API 和 AI 聊天 API。

接口总览见 `../../docs/API-DOC.md`，认证接口见 `../../docs/api/auth.md`，聊天接口见 `../../docs/api/chat.md`。

## 目录

- `src/server.ts`：HTTP 服务启动入口，负责监听端口和关闭 MySQL 连接池。
- `src/app.ts`：Express 应用创建函数，供 HTTP 服务和 e2e 测试复用。
- `src/auth/`：认证模块，按 routes/controller/service/repository/middleware 拆分，实现注册、登录、恢复身份和退出登录。
- `src/chat/`：聊天模块，按 routes/controller/service/repository 拆分，实现会话管理、历史消息查询和 SSE 消息发送，通过 OpenAI SDK 调用可配置模型，测试环境可切换为确定性 stub。
- `src/config/ai.ts`：AI 服务配置，读取 `AI_PROVIDER`、`OPENAI_API_KEY`、`OPENAI_MODEL` 和 `OPENAI_BASE_URL`。
- `src/config/env.ts`：加载本地 `.env` 与 `.env.example`，未设置 `.env` 时使用示例开发配置。
- `src/config/auth.ts`：JWT 密钥与有效期配置。
- `src/db/pool.ts`：MySQL 连接池配置，读取环境变量创建 `mysql2/promise` pool。
- `src/db/schema.ts`：用户认证和聊天相关 MySQL 表结构定义。
- `src/db/migrate.ts`：本地数据库初始化/迁移脚本，创建用户、JWT 吊销、聊天会话和聊天消息表。
- `src/http/`：统一 `{ data, error }` 响应、API 错误类型和 CORS 中间件。
- `src/store/database-example.ts`：数据库连通性示例代码。
- `tests/e2e/`：后端 HTTP + MySQL e2e 测试，覆盖健康检查、认证闭环和聊天接口。
- `tests/helpers/`：e2e 测试数据库初始化、清理和请求构造工具。
- `.env.example`：本地环境变量示例。
- `.env.test.example`：e2e 测试环境变量示例，默认使用 `demo_e2e` 测试库。
- `docker-dev-compose.yml`：本地开发 MySQL 容器配置。

## 命令

```bash
pnpm --filter @ai-chat/backend dev
pnpm --filter @ai-chat/backend build
pnpm --filter @ai-chat/backend typecheck
pnpm --filter @ai-chat/backend lint
pnpm --filter @ai-chat/backend lint:fix
pnpm --filter @ai-chat/backend db:check
pnpm --filter @ai-chat/backend db:init
pnpm --filter @ai-chat/backend db:migrate
pnpm --filter @ai-chat/backend test:e2e
```

## 本地数据库

`docker-dev-compose.yml` 提供 MySQL 8.4 开发环境配置，并通过变量插值读取数据库环境变量。

```bash
docker compose --env-file .env.example -f docker-dev-compose.yml up -d
```

默认连接信息：

- `MYSQL_HOST=localhost`
- `MYSQL_PORT=3307`
- `MYSQL_USER=ai_chat`
- `MYSQL_PASSWORD=123456`
- `MYSQL_DATABASE=demo`

MySQL 数据挂载到项目根目录 `.db`，该目录仅用于本地开发数据。

Root 密码为 `root`，仅用于本地开发。

初始化认证和聊天表：

```bash
pnpm --filter @ai-chat/backend db:init
```

`db:init` 与 `db:migrate` 当前执行同一个幂等迁移脚本，会创建：

- `users`：用户账号表，保存用户名、密码哈希、状态和时间戳。
- `revoked_tokens`：JWT 吊销记录表，退出登录后记录 `jti`、用户 ID 和 token 原始过期时间。
- `chat_sessions`：聊天会话表，保存用户会话标题、状态和最近消息时间。
- `chat_messages`：聊天消息表，保存用户和助手消息、会话内序号、模型和 token 统计信息。

## e2e 测试

e2e 测试复用本地 MySQL Docker 服务，但使用独立测试库 `demo_e2e`，测试启动时会自动创建该数据库并执行迁移。测试清理逻辑只允许作用于名称以 `_e2e` 结尾的数据库，避免误清开发库。

先启动本地 MySQL：

```bash
docker compose --env-file .env.example -f docker-dev-compose.yml up -d
```

运行 e2e：

```bash
pnpm --filter @ai-chat/backend test:e2e
```

如需覆盖默认测试连接信息，可复制 `.env.test.example` 为 `.env.test` 并修改配置。

## 环境变量

- `PORT`：HTTP 服务端口，默认 `3001`。
- `MYSQL_HOST`：MySQL 主机，本地开发使用 `localhost`。
- `MYSQL_PORT`：MySQL 端口，本地开发使用 `3307`。
- `MYSQL_ROOT_PASSWORD`：MySQL Root 密码，本地开发默认 `root`。
- `MYSQL_USER`：MySQL 用户，本地开发建议使用 `ai_chat`。
- `MYSQL_PASSWORD`：MySQL 密码，本地开发使用 `123456`。
- `MYSQL_DATABASE`：MySQL 数据库名，本地开发使用 `demo`。
- `MYSQL_CONNECTION_LIMIT`：MySQL 连接池上限，默认 `10`。
- `JWT_SECRET`：JWT HMAC-SHA256 签名密钥，本地开发可使用示例值，生产环境必须替换。
- `JWT_EXPIRES_IN_DAYS`：JWT 有效天数，默认 `7`。
- `CORS_ORIGINS`：允许跨域访问的前端 Origin，多个值用英文逗号分隔，本地开发默认 `http://localhost:5173`。
- `AI_PROVIDER`：AI 回复提供方，可选 `openai` 或 `stub`，本地开发示例配置为 `openai`。
- `OPENAI_API_KEY`：OpenAI API Key，`AI_PROVIDER=openai` 时必填。
- `OPENAI_MODEL`：OpenAI 模型名称，例如 `gpt-4.1-mini`。
- `OPENAI_BASE_URL`：可选 OpenAI 兼容接口地址，未设置时使用 SDK 默认地址。

## 认证接口

- `POST /api/auth/register`：注册用户，成功后返回用户信息和 JWT。
- `POST /api/auth/login`：使用用户名和密码登录，成功后返回新的 JWT。
- `GET /api/auth/me`：通过 `Authorization: Bearer <token>` 恢复当前用户。
- `POST /api/auth/logout`：吊销当前 JWT 的 `jti`。

## 聊天接口

- `GET /api/chat/sessions`：查询当前用户聊天会话列表。
- `POST /api/chat/sessions`：创建空聊天会话。
- `PATCH /api/chat/sessions/:sessionId`：更新会话标题或归档状态。
- `DELETE /api/chat/sessions/:sessionId`：删除会话及其消息。
- `GET /api/chat/sessions/:sessionId/messages`：查询指定会话的历史消息。
- `POST /api/chat/messages`：发送用户消息，读取当前会话已完成历史消息作为上下文，并通过 SSE 返回助手回复。

业务接口统一响应 `{ data, error }`，全局规范见 `../../docs/API-DOC.md`，认证错误码和状态码见 `../../docs/api/auth.md`。
