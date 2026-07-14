# Asaase

TypeScript monorepo: Express API, Expo mobile, Next.js dashboard.

## Setup

```bash
git clone <repo-url> asaase
cd asaase
pnpm install
```

Requires Node 20 (`nvm use` reads `.nvmrc`).

## Development

From the repo root:

| App       | Command              |
| --------- | -------------------- |
| Backend   | `pnpm dev:backend`   |
| Mobile    | `pnpm dev:mobile`    |
| Dashboard | `pnpm dev:dashboard` |
| All       | `pnpm dev`           |

Or from each app directory: `pnpm dev` (mobile uses `expo start`).

## Build

```bash
pnpm build:backend
pnpm build:mobile
pnpm build:dashboard
```
