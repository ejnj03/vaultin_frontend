# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **Vaultin frontend** (`vaultin_frontend`) — a Vite + React 18 web3 payments client.

The AWS backend (`vaultin-backend`: `vault-auth` + `vault-payments` Lambdas) is **already deployed** in AWS. That separate repo is the SAM source used to upload/redeploy; you do **not** need to run `sam local` for normal frontend development. Point the frontend at the deployed API Gateway URL via `VITE_AUTH_LAMBDA`.

### Service to run here

| Service | Command | Notes |
| --- | --- | --- |
| Frontend (Vite) | `npm run dev` | `http://localhost:5173`. See README "Running it". |

There is **no lint script and no test suite** (`package.json` only has `dev`, `build`, `preview`).

### Environment variables

Create a root `.env` (gitignored) with:

- `VITE_ALCHEMY_API_KEY` — Alchemy RPC + Portfolio
- `VITE_WALLETCONNECT_PROJECT_ID` — ConnectKit / WalletConnect
- `VITE_AUTH_LAMBDA` — **deployed** API Gateway base URL. For this frontend’s relative paths (`/nonce`, `/verify`, `/logout` in `useAuth.js`), the value should end with `/auth` (e.g. `https://<api-id>.execute-api.us-east-1.amazonaws.com/auth`), because the Lambda routes are `/auth/nonce`, etc.

These are **build-time** `VITE_*` vars — restart `npm run dev` after changing `.env`. Without them the landing page still loads; wallet connect, portfolio, auth, transfers, requests, and contacts need the real values.

### Gotchas

- Backend work = edit `vaultin-backend` and `sam deploy`; frontend work = this repo + `.env` pointing at the live API. Do not run `sam local` for normal frontend development.
- Auth and payments are two API Gateways in AWS; this frontend currently has a single `VITE_AUTH_LAMBDA`.
- Some frontend paths still drift from the deployed API (e.g. `/find-username` vs `/auth/utils/find-username`, payment-request path names). Auth SIWE (`/nonce`, `/verify`) works when `VITE_AUTH_LAMBDA` ends with `/auth`.
- `src/utils/config.js` has a hard-coded WalletConnect `projectId`; the live provider path is `src/Web3Provider.jsx` (`VITE_*`).
- Supabase is in `package.json` but unused in `src/`.
- `CryptoDataContext.jsx` hard-codes a separate prices API (`https://9djqt1k5r5.execute-api.us-east-1.amazonaws.com`).
