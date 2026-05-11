# 用户认证接口

本文档记录用户认证相关领域模型和接口。通用响应格式、认证方式、环境变量见 [API 接口总览](../API-DOC.md)。

## 业务错误码

| 错误码                  | 说明             |
| ----------------------- | ---------------- |
| `USERNAME_EXISTS`       | 用户名已存在     |
| `INVALID_CREDENTIALS`   | 用户名或密码错误 |

## 领域模型

### `users`

用户账号表。

| 字段            | 类型建议                       | 说明                     |
| --------------- | ------------------------------ | ------------------------ |
| `id`            | `BIGINT UNSIGNED`              | 用户 ID                  |
| `username`      | `VARCHAR(64)`                  | 用户名，唯一，用于登录   |
| `password_hash` | `VARCHAR(255)`                 | 密码哈希，不保存明文密码 |
| `status`        | `ENUM('active', 'disabled')`   | 用户状态                 |
| `created_at`    | `DATETIME`                     | 创建时间                 |
| `updated_at`    | `DATETIME`                     | 更新时间                 |

### `revoked_tokens`

JWT 吊销记录表，用于让退出登录在服务端立即生效。

| 字段         | 类型建议            | 说明              |
| ------------ | ------------------- | ----------------- |
| `id`         | `BIGINT UNSIGNED`   | 记录 ID           |
| `jti`        | `VARCHAR(64)`       | JWT 唯一 ID，唯一 |
| `user_id`    | `BIGINT UNSIGNED`   | 用户 ID           |
| `expires_at` | `DATETIME`          | JWT 原始过期时间  |
| `revoked_at` | `DATETIME`          | 吊销时间          |

## `POST /api/auth/register`

注册用户。注册成功后直接返回 JWT。

### 请求体

| 字段       | 类型     | 必填 | 说明   |
| ---------- | -------- | ---- | ------ |
| `username` | `string` | 是   | 用户名 |
| `password` | `string` | 是   | 密码   |

### 请求示例

```json
{
  "username": "zhangsan",
  "password": "12345678"
}
```

### 成功响应

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

### 错误响应

| HTTP 状态码 | 错误码              | 说明           |
| ----------- | ------------------- | -------------- |
| `400`       | `INVALID_REQUEST`   | 请求参数不合法 |
| `409`       | `USERNAME_EXISTS`   | 用户名已存在   |

## `POST /api/auth/login`

使用用户名和密码登录。登录成功后返回新的 JWT。

### 请求体

| 字段       | 类型     | 必填 | 说明   |
| ---------- | -------- | ---- | ------ |
| `username` | `string` | 是   | 用户名 |
| `password` | `string` | 是   | 密码   |

### 请求示例

```json
{
  "username": "zhangsan",
  "password": "12345678"
}
```

### 成功响应

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

### 错误响应

| HTTP 状态码 | 错误码                  | 说明             |
| ----------- | ----------------------- | ---------------- |
| `400`       | `INVALID_REQUEST`       | 请求参数不合法   |
| `401`       | `INVALID_CREDENTIALS`   | 用户名或密码错误 |
| `403`       | `USER_DISABLED`         | 用户已被禁用     |

## `GET /api/auth/me`

恢复当前登录用户身份。客户端启动或刷新页面后，可使用本地保存的 JWT 调用该接口获取当前用户信息。

### 请求头

```http
Authorization: Bearer <token>
```

### 成功响应

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

### 错误响应

| HTTP 状态码 | 错误码            | 说明                                            |
| ----------- | ----------------- | ----------------------------------------------- |
| `401`       | `UNAUTHORIZED`    | 未登录、token 无效、token 已过期或 token 已吊销 |
| `403`       | `USER_DISABLED`   | 用户已被禁用                                    |

## `POST /api/auth/logout`

退出登录。服务端将当前 JWT 的 `jti` 写入吊销记录。

### 请求头

```http
Authorization: Bearer <token>
```

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

| HTTP 状态码 | 错误码          | 说明                              |
| ----------- | --------------- | --------------------------------- |
| `401`       | `UNAUTHORIZED`  | 未登录、token 无效或 token 已过期 |
