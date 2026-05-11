# Frontend

Frontend subproject for the AI chat application. It provides the username and
password authentication UI described in `../../docs/API-DOC.md`.

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
- `src/store/useAuth.ts`: local authentication state, startup restore, and logout handling.

## Source Directories

- `src/api`: API request modules and response parsing.
- `src/assets`: frontend static assets.
- `src/components`: reusable React components, including the auth form.
- `src/config`: frontend runtime configuration.
- `src/constants`: shared static constants, including token storage keys.
- `src/pages`: authentication and signed-in page components.
- `src/router`: lightweight conditional app routing without a routing library.
- `src/store`: client-side authentication state management.
- `src/styles`: shared and page-level styles.
- `src/utils`: reusable utility functions, including localStorage token helpers.

## Scripts

- `pnpm dev`: start the Vite dev server.
- `pnpm build`: type-check and build the app.
- `pnpm preview`: preview the production build.
- `pnpm typecheck`: run TypeScript checks.
- `pnpm lint`: run TypeScript checks as the current placeholder lint.
