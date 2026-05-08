# API 接口说明

当前后端服务只包含占位接口，尚未实现业务接口。

## 基础信息

- 服务目录：`apps/backend`
- 默认端口：`3001`
- 默认地址：`http://localhost:3001`

## 健康检查

### `GET /health`

用于确认后端服务是否正常启动。

#### 响应示例

```json
{
  "status": "ok",
  "service": "backend"
}
```

## MySQL 配置

后端通过 `mysql2/promise` 创建连接池，配置读取自环境变量。

| 变量 | 开发环境推荐值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | HTTP 服务端口 |
| `MYSQL_HOST` | `localhost` | MySQL 主机 |
| `MYSQL_PORT` | `3307` | MySQL 端口 |
| `MYSQL_ROOT_PASSWORD` | `root` | MySQL Root 密码，仅用于本地开发 |
| `MYSQL_USER` | `ai_chat` | MySQL 用户 |
| `MYSQL_PASSWORD` | `123456` | MySQL 密码 |
| `MYSQL_DATABASE` | `demo` | MySQL 数据库名 |
| `MYSQL_CONNECTION_LIMIT` | `10` | MySQL 连接池上限 |

本地开发数据库可使用 `apps/backend/docker-dev-compose.yml` 启动，Compose 配置通过变量插值读取 `apps/backend/.env.example`。
