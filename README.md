# AI Chat

pnpm monorepo 示例工程，包含一个前端应用和一个后端服务。

## 目录

- `apps/frontend`：Vite + React + TypeScript + Ant Design 前端占位应用。
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

后端已实现用户名密码注册、登录、恢复身份和退出登录接口，接口契约见 `docs/API-DOC.md`。
