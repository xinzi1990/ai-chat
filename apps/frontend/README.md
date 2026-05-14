# Frontend

Frontend subproject for the AI chat application. It provides the username and
password authentication UI described in `../../docs/api/auth.md`, plus the chat
session UI described in `../../docs/api/chat.md`.

## Stack

- Vite
- React
- TypeScript
- Ant Design

## Key Files

- `.env.example`: example Vite API base URL configuration.
- `src/App.tsx`: Ant Design providers and frontend router entry.
- `src/index.css`: base application styles and Ant Design reset import.
- `src/api/client.ts`: shared `{ data, error }` API response handling and token header injection.
- `src/api/auth.ts`: authentication API calls.
- `src/api/chat.ts`: chat session, message history, session mutation and `/api/chat/stream` SSE sending API calls.
- `src/store/useAuth.ts`: local authentication state, startup restore, and logout handling.
- `src/store/useChat.ts`: chat session list, active messages, local new-chat state, title editing, deletion and stream state.
- `src/pages/DashboardPage.tsx`: authenticated chat page entry.
- `src/components/ChatComposer.tsx`: chat input and send flow.

## Source Directories

- `src/api`: API request modules and response parsing.
- `src/assets`: frontend static assets.
- `src/components`: reusable React components, including the auth form and chat layout/sidebar/message/composer components.
- `src/config`: frontend runtime configuration.
- `src/constants`: shared static constants, including token storage keys.
- `src/pages`: authentication and signed-in page components.
- `src/router`: lightweight conditional app routing without a routing library.
- `src/store`: client-side authentication state management.
- `src/styles`: shared and page-level styles, including `chat.css` and streaming cursor styles.
- `src/utils`: reusable utility functions, including localStorage token helpers and SSE stream parsing.

## Scripts

- `pnpm dev`: start the Vite dev server.
- `pnpm build`: type-check and build the app.
- `pnpm preview`: preview the production build.
- `pnpm typecheck`: run TypeScript checks.
- `pnpm lint`: run ESLint with the root flat config.
- `pnpm lint:fix`: run ESLint auto-fix, including 4-space indentation fixes.
