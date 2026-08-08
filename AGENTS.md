# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **Vaultin frontend** (`vaultin_frontend`) — a Vite + React 18 web3 payments client. Local full-stack development pairs it with **[`vaultin-backend`](https://github.com/ejnj03/vaultin-backend)** (AWS SAM, two Python Lambdas: `vault-auth` + `vault-payments`).

In this Cloud Agent VM the backend is typically cloned at `/home/ubuntu/vaultin-backend` (it is a separate GitHub repo, not part of this workspace checkout).

### Services

| Service | Command | Notes |
| --- | --- | --- |
| Frontend (Vite) | `npm run dev` | `http://localhost:5173`. See README "Running it". |
| Backend auth (local) | `cd /home/ubuntu/vaultin-backend/vault-auth && sam build && sam local start-api` | `http://127.0.0.1:3000`. Needs Docker + AWS creds (Secrets Manager / DynamoDB). |
| Backend payments (local) | `cd /home/ubuntu/vaultin-backend/vault-payments && sam build && sam local start-api --port 3001` | Separate SAM stack / port. |

There is **no lint script and no test suite** in this frontend repo (`package.json` only has `dev`, `build`, `preview`). Backend likewise has no pytest/lint scripts — `sam build` is the smoke check.

### Environment variables (frontend)

Create a root `.env` (gitignored) with:

- `VITE_ALCHEMY_API_KEY` — Alchemy RPC + Portfolio
- `VITE_WALLETCONNECT_PROJECT_ID` — ConnectKit / WalletConnect
- `VITE_AUTH_LAMBDA` — API base URL, no trailing slash (deployed API Gateway, or local e.g. `http://127.0.0.1:3000` / with path prefix depending on how routes are called)

These are **build-time** `VITE_*` vars. Without them the landing page still loads; wallet connect, portfolio, auth, transfers, requests, and contacts need the real values.

### Gotchas

- `sam local` still calls **real AWS** (Secrets Manager secrets `vault-auth-secrets` / `vault-payments-secrets`, DynamoDB tables). There is no LocalStack/offline mode in the backend repo.
- Auth cookies are set with `Secure; SameSite=None` — they may not stick against plain `http://127.0.0.1` SAM local without TLS or a cookie-flag change.
- Frontend and backend route prefixes do not always match 1:1 (e.g. frontend may call `/nonce` while backend exposes `/auth/nonce`). Check `src/utils/useAuth.js` and backend `template.yaml` before assuming local E2E works out of the box.
- Auth and payments are **two** API Gateways; the frontend currently has a single `VITE_AUTH_LAMBDA`.
- `src/utils/config.js` has a hard-coded WalletConnect `projectId`; the live provider path is `src/Web3Provider.jsx` (`VITE_*`).
- Supabase is in `package.json` but unused in `src/`.
- Docker (fuse-overlayfs) + AWS CLI + SAM CLI (`~/.local/bin/sam`) + Python 3.11 are needed for local backend; start `dockerd` if the daemon is not already running.
- Backend templates target `arm64`. On amd64 Cloud Agent VMs, temporarily switch `Architectures` to `x86_64` in the local backend checkout before `sam local start-api`, or image build fails with exit 255.
- `sam local` requires valid AWS credentials that can read Secrets Manager (`vault-auth-secrets`, `vault-payments-secrets`) and the DynamoDB tables; without them Lambda init fails at import time.
