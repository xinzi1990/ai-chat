# AI Chat

pnpm monorepo 示例工程，包含一个前端应用和一个后端服务。

## 目录

- `apps/frontend`：Vite + React + TypeScript + Ant Design 前端应用，已实现基于 JWT 的登录、注册、恢复当前用户和退出登录界面。
- `apps/backend`：Node.js + Express + TypeScript + MySQL 后端服务，提供健康检查和用户认证 API。
- `docs`：接口说明和项目文档。

## 命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
```

## 说明

前端认证功能按 `docs/API-DOC.md` 调用 `/api/auth/register`、`/api/auth/login`、`/api/auth/me` 和 `/api/auth/logout`。后端已实现对应认证接口，前端默认 API 地址见 `apps/frontend/.env.example`。
