# AI Chat

pnpm monorepo 示例工程，包含一个前端应用和一个后端服务。

## 目录

- `apps/frontend`：Vite + React + TypeScript + Ant Design 前端应用，已实现基于 JWT 的登录、注册、恢复当前用户、退出登录和 AI 聊天界面。
- `apps/backend`：Node.js + Express + TypeScript + MySQL 后端服务，提供健康检查、用户认证 API 和 AI 聊天 API。
- `docs`：接口说明和项目文档，包含已实现的认证接口和 AI 聊天接口设计。

## 命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm lint:fix
pnpm test:e2e
```

## 说明

前端认证功能按 `docs/api/auth.md` 调用 `/api/auth/register`、`/api/auth/login`、`/api/auth/me` 和 `/api/auth/logout`。后端已实现对应认证接口，前端默认 API 地址见 `apps/frontend/.env.example`。
AI 聊天会话和消息接口已在 `docs/api/chat.md` 中完成第一版设计，后端已实现会话管理、历史消息查询和基于 OpenAI SDK 的 SSE 消息发送接口；前端已接入会话列表、历史消息、会话标题编辑、会话删除和流式消息发送，新会话首条消息会通过 `POST /api/chat/stream` 自动创建服务端会话；模型通过 `OPENAI_MODEL` 配置。
后端 e2e 测试复用本地 MySQL Docker 服务，使用独立测试库 `demo_e2e`。

项目使用 ESLint flat config 做代码检查，配合 `.editorconfig` 统一 4 空格缩进。
