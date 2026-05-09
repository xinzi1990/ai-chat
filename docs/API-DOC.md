# API 接口说明

本文档记录后端服务的接口约定。当前后端已实现健康检查接口，用户认证接口为待实现设计。

## 基础信息

| 项目     | 说明                      |
| -------- | ------------------------- |
| 服务目录 | `apps/backend`          |
| 默认端口 | `3001`                  |
| 默认地址 | `http://localhost:3001` |
| 请求格式 | `application/json`      |
| 响应格式 | `application/json`      |

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

### 常用错误码

| 错误码                  | 说明                |
| ----------------------- | ------------------- |
| `INVALID_REQUEST`     | 请求参数不合法      |
| `USERNAME_EXISTS`     | 用户名已存在        |
| `INVALID_CREDENTIALS` | 用户名或密码错误    |
| `UNAUTHORIZED`        | 未登录或 token 无效 |
| `USER_DISABLED`       | 用户已被禁用        |
| `INTERNAL_ERROR`      | 服务内部错误        |

## 认证约定

用户系统使用单个 JWT 作为登录凭证。

客户端在需要认证的接口中通过 `Authorization` 请求头传递 token。

```http
Authorization: Bearer <token>
```

JWT payload 包含以下字段：

| 字段         | 说明                                    |
| ------------ | --------------------------------------- |
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

## 领域模型

### `users`

用户账号表。

| 字段              | 类型建议                       | 说明                     |
| ----------------- | ------------------------------ | ------------------------ |
| `id`            | `BIGINT UNSIGNED`            | 用户 ID                  |
| `username`      | `VARCHAR(64)`                | 用户名，唯一，用于登录   |
| `password_hash` | `VARCHAR(255)`               | 密码哈希，不保存明文密码 |
| `status`        | `ENUM('active', 'disabled')` | 用户状态                 |
| `created_at`    | `DATETIME`                   | 创建时间                 |
| `updated_at`    | `DATETIME`                   | 更新时间                 |

### `revoked_tokens`

JWT 吊销记录表，用于让退出登录在服务端立即生效。

| 字段           | 类型建议            | 说明              |
| -------------- | ------------------- | ----------------- |
| `id`         | `BIGINT UNSIGNED` | 记录 ID           |
| `jti`        | `VARCHAR(64)`     | JWT 唯一 ID，唯一 |
| `user_id`    | `BIGINT UNSIGNED` | 用户 ID           |
| `expires_at` | `DATETIME`        | JWT 原始过期时间  |
| `revoked_at` | `DATETIME`        | 吊销时间          |

## 用户认证

### `POST /api/auth/register`

注册用户。注册成功后直接返回 JWT。

#### 请求体

| 字段         | 类型       | 必填 | 说明   |
| ------------ | ---------- | ---- | ------ |
| `username` | `string` | 是   | 用户名 |
| `password` | `string` | 是   | 密码   |

#### 请求示例

```json
{
  "username": "zhangsan",
  "password": "12345678"
}
```

#### 成功响应

```json
{
  "data": {
    "user": {
      "id": "1",
      "username": "zhangsan"
    },
    "token": "jwt-token"
  },
  "error": null
}
```

#### 错误响应

| HTTP 状态码 | 错误码              | 说明           |
| ----------- | ------------------- | -------------- |
| `400`     | `INVALID_REQUEST` | 请求参数不合法 |
| `409`     | `USERNAME_EXISTS` | 用户名已存在   |

### `POST /api/auth/login`

使用用户名和密码登录。登录成功后返回新的 JWT。

#### 请求体

| 字段         | 类型       | 必填 | 说明   |
| ------------ | ---------- | ---- | ------ |
| `username` | `string` | 是   | 用户名 |
| `password` | `string` | 是   | 密码   |

#### 请求示例

```json
{
  "username": "zhangsan",
  "password": "12345678"
}
```

#### 成功响应

```json
{
  "data": {
    "user": {
      "id": "1",
      "username": "zhangsan"
    },
    "token": "jwt-token"
  },
  "error": null
}
```

#### 错误响应

| HTTP 状态码 | 错误码                  | 说明             |
| ----------- | ----------------------- | ---------------- |
| `400`     | `INVALID_REQUEST`     | 请求参数不合法   |
| `401`     | `INVALID_CREDENTIALS` | 用户名或密码错误 |
| `403`     | `USER_DISABLED`       | 用户已被禁用     |

### `GET /api/auth/me`

恢复当前登录用户身份。客户端启动或刷新页面后，可使用本地保存的 JWT 调用该接口获取当前用户信息。

#### 请求头

```http
Authorization: Bearer <token>
```

#### 成功响应

```json
{
  "data": {
    "user": {
      "id": "1",
      "username": "zhangsan"
    }
  },
  "error": null
}
```

#### 错误响应

| HTTP 状态码 | 错误码            | 说明                                            |
| ----------- | ----------------- | ----------------------------------------------- |
| `401`     | `UNAUTHORIZED`  | 未登录、token 无效、token 已过期或 token 已吊销 |
| `403`     | `USER_DISABLED` | 用户已被禁用                                    |

### `POST /api/auth/logout`

退出登录。服务端将当前 JWT 的 `jti` 写入吊销记录。

#### 请求头

```http
Authorization: Bearer <token>
```

#### 成功响应

```json
{
  "data": {
    "success": true
  },
  "error": null
}
```

#### 错误响应

| HTTP 状态码 | 错误码           | 说明                              |
| ----------- | ---------------- | --------------------------------- |
| `401`     | `UNAUTHORIZED` | 未登录、token 无效或 token 已过期 |

## 环境变量

后端通过环境变量读取 HTTP、MySQL 和认证配置。

| 变量                       | 开发环境推荐值                | 说明                            |
| -------------------------- | ----------------------------- | ------------------------------- |
| `PORT`                   | `3001`                      | HTTP 服务端口                   |
| `MYSQL_HOST`             | `localhost`                 | MySQL 主机                      |
| `MYSQL_PORT`             | `3307`                      | MySQL 端口                      |
| `MYSQL_ROOT_PASSWORD`    | `root`                      | MySQL Root 密码，仅用于本地开发 |
| `MYSQL_USER`             | `ai_chat`                   | MySQL 用户                      |
| `MYSQL_PASSWORD`         | `123456`                    | MySQL 密码                      |
| `MYSQL_DATABASE`         | `demo`                      | MySQL 数据库名                  |
| `MYSQL_CONNECTION_LIMIT` | `10`                        | MySQL 连接池上限                |
| `JWT_SECRET`             | `replace-with-local-secret` | JWT 签名密钥                    |
| `JWT_EXPIRES_IN_DAYS`    | `7`                         | JWT 有效天数                    |

本地开发数据库可使用 `apps/backend/docker-dev-compose.yml` 启动，Compose 配置通过变量插值读取 `apps/backend/.env.example`。
