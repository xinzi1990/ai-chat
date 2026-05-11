# AI Chat

## 工程功能

这是一个 pnpm monorepo 示例工程，包含两个子工程：

- `apps/frontend`：前端应用，使用 Vite、React、TypeScript 和 Ant Design 基础结构。
- `apps/backend`：后端服务，使用 Node.js、Express、TypeScript 和 MySQL，提供健康检查和 JWT 用户认证接口。
- `docs`：接口说明和项目文档，包含用户认证接口设计。

当前后端已实现用户名密码注册、登录、恢复身份、退出登录的 JWT 认证 API；前端仍为基础占位应用。

## 关键目录结构

```text
.
├── apps/
│   ├── frontend/     # Vite + React + Ant Design 前端应用
│   └── backend/      # Node + Express + MySQL 后端服务，含认证 API、本地 MySQL Docker Compose 配置与数据库迁移脚本
├── .db/              # 本地 MySQL 数据目录，不进入版本管理
├── docs/             # 接口说明和项目文档
├── package.json      # 根目录脚本与 workspace 声明
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 开发约定

- 使用 `pnpm` 管理依赖。
- 前端与后端均使用 TypeScript。
- 单个代码文件原则上不宜超过 300 行；复杂模块应拆分。
- 若目录中存在 `README.md`，内容必须真实反映该目录实际情况。
