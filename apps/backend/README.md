# Backend

Node.js + Express + TypeScript 后端占位服务，使用 `mysql2` 提供 MySQL 连接池配置占位。

接口说明见 `../../docs/api.md`。

## 目录

- `src/server.ts`：Express 应用入口，提供 `/health` 占位接口。
- `src/db/pool.ts`：MySQL 连接池配置占位，读取环境变量创建 `mysql2/promise` pool。
- `.env.example`：本地环境变量示例。

## 命令

```bash
pnpm --filter @ai-chat/backend dev
pnpm --filter @ai-chat/backend build
pnpm --filter @ai-chat/backend typecheck
pnpm --filter @ai-chat/backend lint
```

## 环境变量

- `PORT`：HTTP 服务端口，默认 `3001`。
- `MYSQL_HOST`：MySQL 主机，默认 `127.0.0.1`。
- `MYSQL_PORT`：MySQL 端口，默认 `3306`。
- `MYSQL_USER`：MySQL 用户，默认 `root`。
- `MYSQL_PASSWORD`：MySQL 密码，默认空字符串。
- `MYSQL_DATABASE`：MySQL 数据库名，默认 `ai_chat`。
