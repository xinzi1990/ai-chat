# Backend

Node.js + Express + TypeScript 后端占位服务，使用 `mysql2` 提供 MySQL 连接池配置占位。

接口说明见 `../../docs/API-DOC.md`。

## 目录

- `src/server.ts`：Express 应用入口，提供 `/health` 占位接口。
- `src/db/pool.ts`：MySQL 连接池配置占位，读取环境变量创建 `mysql2/promise` pool。
- `src/store/database-example.ts`：数据库连通性示例代码。
- `.env.example`：本地环境变量示例。
- `docker-dev-compose.yml`：本地开发 MySQL 容器配置。

## 命令

```bash
pnpm --filter @ai-chat/backend dev
pnpm --filter @ai-chat/backend build
pnpm --filter @ai-chat/backend typecheck
pnpm --filter @ai-chat/backend lint
pnpm --filter @ai-chat/backend db:check
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

## 环境变量

- `PORT`：HTTP 服务端口，默认 `3001`。
- `MYSQL_HOST`：MySQL 主机，本地开发使用 `localhost`。
- `MYSQL_PORT`：MySQL 端口，本地开发使用 `3307`。
- `MYSQL_ROOT_PASSWORD`：MySQL Root 密码，本地开发默认 `root`。
- `MYSQL_USER`：MySQL 用户，本地开发建议使用 `ai_chat`。
- `MYSQL_PASSWORD`：MySQL 密码，本地开发使用 `123456`。
- `MYSQL_DATABASE`：MySQL 数据库名，本地开发使用 `demo`。
- `MYSQL_CONNECTION_LIMIT`：MySQL 连接池上限，默认 `10`。
