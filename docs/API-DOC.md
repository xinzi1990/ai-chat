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

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | HTTP 服务端口 |
| `MYSQL_HOST` | `127.0.0.1` | MySQL 主机 |
| `MYSQL_PORT` | `3306` | MySQL 端口 |
| `MYSQL_USER` | `root` | MySQL 用户 |
| `MYSQL_PASSWORD` | 空字符串 | MySQL 密码 |
| `MYSQL_DATABASE` | `ai_chat` | MySQL 数据库名 |
| `MYSQL_CONNECTION_LIMIT` | `10` | MySQL 连接池上限 |
