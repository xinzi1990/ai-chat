# Backend

Node.js + Express + TypeScript 后端服务，使用 `mysql2` 连接 MySQL，提供健康检查和 JWT 用户认证 API。

接口说明见 `../../docs/API-DOC.md`。

## 目录

- `src/server.ts`：Express 应用入口，挂载 `/health` 和 `/api/auth`。
- `src/auth/`：认证模块，按 routes/controller/service/repository/middleware 拆分，实现注册、登录、恢复身份和退出登录。
- `src/config/env.ts`：加载本地 `.env` 与 `.env.example`，未设置 `.env` 时使用示例开发配置。
- `src/config/auth.ts`：JWT 密钥与有效期配置。
- `src/db/pool.ts`：MySQL 连接池配置，读取环境变量创建 `mysql2/promise` pool。
- `src/db/schema.ts`：用户认证相关 MySQL 表结构定义。
- `src/db/migrate.ts`：本地数据库初始化/迁移脚本，创建 `users` 和 `revoked_tokens` 表。
- `src/http/`：统一 `{ data, error }` 响应、API 错误类型和 CORS 中间件。
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
pnpm --filter @ai-chat/backend db:init
pnpm --filter @ai-chat/backend db:migrate
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

初始化认证表：

```bash
pnpm --filter @ai-chat/backend db:init
```

`db:init` 与 `db:migrate` 当前执行同一个幂等迁移脚本，会创建：

- `users`：用户账号表，保存用户名、密码哈希、状态和时间戳。
- `revoked_tokens`：JWT 吊销记录表，退出登录后记录 `jti`、用户 ID 和 token 原始过期时间。

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

## 认证接口

- `POST /api/auth/register`：注册用户，成功后返回用户信息和 JWT。
- `POST /api/auth/login`：使用用户名和密码登录，成功后返回新的 JWT。
- `GET /api/auth/me`：通过 `Authorization: Bearer <token>` 恢复当前用户。
- `POST /api/auth/logout`：吊销当前 JWT 的 `jti`。

业务接口统一响应 `{ data, error }`，错误码和状态码见 `../../docs/API-DOC.md`。
