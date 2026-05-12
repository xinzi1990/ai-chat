# AI Chat

## 工程功能

这是一个 pnpm monorepo 示例工程，包含两个子工程：

- `apps/frontend`：前端应用，使用 Vite、React、TypeScript 和 Ant Design，实现用户名密码登录、带二次密码确认的注册、启动恢复当前用户、退出登录和 AI 聊天页面。
- `apps/backend`：后端服务，使用 Node.js、Express、TypeScript 和 MySQL，提供健康检查、JWT 用户认证、AI 聊天会话和消息接口，并通过 Vitest + Supertest 覆盖 HTTP + MySQL e2e 测试；MySQL 时间按 UTC 解析，前端按北京时间展示。
- `docs`：接口说明和项目文档，包含已实现的用户认证接口和 AI 聊天接口设计。

当前前后端已基于 `docs/api/auth.md` 实现用户名密码注册、登录、恢复身份、退出登录的 JWT 认证闭环。
AI 聊天功能已在 `docs/api/chat.md` 中完成第一版接口设计，后端已实现会话管理、历史消息查询和基于 OpenAI SDK 的 SSE 消息发送接口，模型通过 `OPENAI_MODEL` 配置；前端已实现左右两栏聊天页、历史会话列表、会话标题编辑、会话删除、Markdown 回复渲染、SSE 流式回复展示、回复中光标提示和回复时自动滚动到底部。前端“新会话”只进入空白编辑态，首条消息通过 `POST /api/chat/stream` 自动创建服务端会话。

## 关键目录结构

```text
.
├── apps/
│   ├── frontend/     # Vite + React + Ant Design 前端认证应用，src 下包含 api/assets/components/config/constants/pages/router/store/styles/utils
│   └── backend/      # Node + Express + MySQL 后端服务，含认证 API、聊天 API、本地 MySQL Docker Compose 配置、数据库迁移脚本与 e2e 测试
├── .db/              # 本地 MySQL 数据目录，不进入版本管理
├── docs/             # 接口说明和项目文档，API-DOC.md 为总览，api/ 下按业务模块拆分接口文档，api-preview.html 为静态预览页
├── eslint.config.js  # 根目录 ESLint flat config，统一 TypeScript/React/Node 代码检查和 4 空格缩进
├── package.json      # 根目录脚本与 workspace 声明
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 开发约定

- 使用 `pnpm` 管理依赖。
- 前端与后端均使用 TypeScript。
- 使用根目录 `eslint.config.js` 统一 ESLint 检查，默认缩进为 4 个空格；可执行 `pnpm lint` 检查，`pnpm lint:fix` 自动修复。
- 单个代码文件原则上不宜超过 300 行；复杂模块应拆分。
- 若目录中存在 `README.md`，内容必须真实反映该目录实际情况。
- 新增或修改 API Markdown 文档时，默认同步生成或更新对应的 HTML 预览页。
