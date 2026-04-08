# The Friends Hub

Monorepo: **Vue 3 + Vite** client and **Node + Express + Socket.IO** server (Elias game).

## Layout

```
├── client/          # Frontend (Vue + Vite)
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env         # optional; see .env.example
├── server/          # Backend (Node + Express + Socket.IO)
│   ├── src/
│   │   ├── routes/      # HTTP routes (e.g. /health)
│   │   ├── models/      # In-memory store + word list loader
│   │   ├── socket/      # Socket.IO game logic
│   │   └── server.js    # Entry point
│   ├── package.json
│   └── .env         # optional; see .env.example
├── package.json     # npm workspaces + dev scripts
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 18+ (20 recommended)

## Install

From the repository root:

```bash
npm install
```

This installs root dev tools and hoists workspace dependencies for `client` and `server`.

## Development

Run **API + Vite** together (recommended):

```bash
npm run dev:full
```

Or in two terminals:

```bash
npm run server    # http://localhost:3000
npm run dev       # Vite → http://localhost:5173
```

The Vite dev server proxies `/socket.io` to the API on port 3000.

## Build (client)

```bash
npm run build
```

Preview the static build:

```bash
npm run preview
```

## Environment

- **client**: copy `client/.env.example` to `client/.env` if you need `VITE_SOCKET_URL` (e.g. production or preview against another host).
- **server**: copy `server/.env.example` to `server/.env` to set `PORT` and `CORS_ORIGIN`. Defaults match local Vite.

## Docker (optional)

```bash
docker compose up server
```

Runs the API in a container; run the client with `npm run dev` on the host, or extend the compose file to add a `client` service.

## Deploy (Render) — static site build

For the **Static Site** service (root directory `client`):

1. **Node version:** use **20.x** (see `client/.nvmrc`). In Render: **Environment** → add `NODE_VERSION` = `20` if the dashboard offers it, or pick Node 20 in the service settings.
2. **Build command:** use `npm install && npm run build` (not `npm ci` unless your lockfile was generated on Linux).
3. **Publish directory:** `dist`.

If the build fails with **`MODULE_NOT_FOUND`** for `@rollup/rollup-linux-x64-gnu`, that is [npm optional-deps + Rollup](https://github.com/npm/cli/issues/4828) on Linux CI. This repo pins **`@rollup/rollup-linux-x64-gnu`** in the **root** `package.json` under `optionalDependencies` so Linux installs get the native binary while Windows/mac dev installs skip it safely.

If it still fails on Render:

- Deploy from the **monorepo root** (where the root `package.json` lives), not a subfolder that omits it.
- **Clear build cache** and redeploy.
- Use **Build command:** `npm install && npm run build` (root), or for workspace-only: `npm install && npm run build --workspace=client`.
- Prefer **Node 20** (`NODE_VERSION=20` or `client/.nvmrc`).

## License

Private project.
