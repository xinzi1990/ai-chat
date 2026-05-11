# API 接口总览

本文档记录后端服务的全局 API 约定。具体业务接口按模块拆分到独立文档中。

## 基础信息

| 项目     | 说明                      |
| -------- | ------------------------- |
| 服务目录 | `apps/backend`            |
| 默认端口 | `3001`                    |
| 默认地址 | `http://localhost:3001`   |
| 请求格式 | `application/json`        |
| 响应格式 | `application/json`        |

## 业务接口文档

- [用户认证接口](./api/auth.md)
- [AI 聊天接口](./api/chat.md)

## 通用响应格式

业务接口统一使用以下响应结构。

### 成功响应

```json
{
  "data": {},
  "error": null
}
```

### 错误响应

```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误说明"
  }
}
```

## 认证约定

用户系统使用单个 JWT 作为登录凭证。

客户端在需要认证的接口中通过 `Authorization` 请求头传递 token。

```http
Authorization: Bearer <token>
```

JWT payload 包含以下字段：

| 字段       | 说明                                    |
| ---------- | --------------------------------------- |
| `sub`      | 用户 ID                                 |
| `username` | 用户名                                  |
| `jti`      | JWT 唯一 ID，用于退出登录后的服务端吊销 |
| `iat`      | 签发时间                                |
| `exp`      | 过期时间                                |

退出登录时，服务端解析当前 JWT，将 `jti` 写入吊销记录。后续认证时应同时校验：

- JWT 签名有效。
- JWT 未过期。
- `jti` 未被吊销。
- 用户状态为 `active`。

## 通用错误码

| 错误码                | 说明                |
| --------------------- | ------------------- |
| `INVALID_REQUEST`     | 请求参数不合法      |
| `UNAUTHORIZED`        | 未登录或 token 无效 |
| `USER_DISABLED`       | 用户已被禁用        |
| `INTERNAL_ERROR`      | 服务内部错误        |

业务模块专属错误码在对应业务接口文档中说明。

## 环境变量

后端通过环境变量读取 HTTP、MySQL、认证和 AI 服务配置。

| 变量                       | 开发环境推荐值                | 说明                            |
| -------------------------- | ----------------------------- | ------------------------------- |
| `PORT`                     | `3001`                        | HTTP 服务端口                   |
| `MYSQL_HOST`               | `localhost`                   | MySQL 主机                      |
| `MYSQL_PORT`               | `3307`                        | MySQL 端口                      |
| `MYSQL_ROOT_PASSWORD`      | `root`                        | MySQL Root 密码，仅用于本地开发 |
| `MYSQL_USER`               | `ai_chat`                     | MySQL 用户                      |
| `MYSQL_PASSWORD`           | `123456`                      | MySQL 密码                      |
| `MYSQL_DATABASE`           | `demo`                        | MySQL 数据库名                  |
| `MYSQL_CONNECTION_LIMIT`   | `10`                          | MySQL 连接池上限                |
| `JWT_SECRET`               | `replace-with-local-secret`   | JWT 签名密钥                    |
| `JWT_EXPIRES_IN_DAYS`      | `7`                           | JWT 有效天数                    |
| `CORS_ORIGINS`             | `http://localhost:5173`       | 允许跨域访问的前端 Origin       |
| `AI_PROVIDER`              | `openai`                      | AI 回复提供方，可选 `openai` 或 `stub` |
| `OPENAI_API_KEY`           | 空                            | OpenAI API Key                  |
| `OPENAI_MODEL`             | `gpt-4.1-mini`                | OpenAI 模型名称                 |
| `OPENAI_BASE_URL`          | 空                            | 可选 OpenAI 兼容接口地址        |

本地开发数据库可使用 `apps/backend/docker-dev-compose.yml` 启动，Compose 配置通过变量插值读取 `apps/backend/.env.example`。
