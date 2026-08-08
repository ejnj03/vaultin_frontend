# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **Vaultin frontend** (`vaultin_frontend`) — a Vite + React 18 web3 payments client. The AWS Lambda backend lives in a separate repo (`vaultin-backend`) and is not runnable from this workspace.

### Service

| Service | Command | Notes |
| --- | --- | --- |
| Frontend (Vite) | `npm run dev` | Serves at `http://localhost:5173`. See README "Running it". |

There is **no lint script and no test suite** in this repo (`package.json` only has `dev`, `build`, `preview`).

### Environment variables

Create a root `.env` (gitignored) with:

- `VITE_ALCHEMY_API_KEY` — Alchemy RPC + Portfolio
- `VITE_WALLETCONNECT_PROJECT_ID` — ConnectKit / WalletConnect
- `VITE_AUTH_LAMBDA` — deployed API Gateway base URL (no trailing slash)

These are **build-time** `VITE_*` vars (Vite inlines them). Without them the landing page still loads, but wallet connect, portfolio, auth, transfers, requests, and contacts will not work against real backends.

### Gotchas

- End-to-end flows past the landing page require the external `vaultin-backend` API (`VITE_AUTH_LAMBDA`) plus a browser wallet for SIWE.
- `src/utils/config.js` has a hard-coded WalletConnect `projectId`; the live provider path used by the app is `src/Web3Provider.jsx`, which reads `VITE_*` env vars.
- Supabase is listed in `package.json` but is unused in `src/`.
