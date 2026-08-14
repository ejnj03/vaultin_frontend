# Vaultin

A non-custodial payments app on Ethereum. Send money to a username instead of an
address, request payments from friends, and swap tokens — without the app ever
holding a key.

This is the web client. The backend lives in
[**vaultin-backend**](https://github.com/einjun03/vaultin-backend) — two AWS
Lambda services, including a Uniswap V4 Universal Router calldata engine with
atomic Permit2.

**Stack** — Vite + React 18, wagmi + viem, ConnectKit, ethers v5, SIWE,
Alchemy SDK, Supabase, TanStack Query, Tailwind + daisyUI.

___

Quotes simulate the swap on-chain across routes in parallel, then show an accurate, full cost breakdown of the most optimal route — swap fee, gas, and total — before you sign.

https://github.com/user-attachments/assets/d8811f45-c9cc-4282-a288-fa11dc51bb8d

---

## The idea

Crypto payments ask you to paste a 42-character address and hope. Vaultin puts a
social layer over that: register a username, add friends, send or request money
by name. The username resolves to an address at send time, so the transaction is
still an ordinary on-chain transfer.

**Non-custodial throughout.** The app never holds a key and never signs. The
backend returns unsigned calldata; your wallet signs it. There is no account to
create — signing in *is* proving you own the address.

## Sign-In With Ethereum

No passwords. [`src/utils/useAuth.js`](src/utils/useAuth.js) implements
[EIP-4361](https://eips.ethereum.org/EIPS/eip-4361):

```
GET  /auth/nonce   → server nonce
                     build a SiweMessage, wallet signs it
POST /auth/verify  → signature verified, httpOnly session cookie issued
```

The cookie is set server-side and sent with `credentials: "include"`, so the
session token is never readable from JavaScript. The address recovered from the
signature is the identity.

## Screens

| Route | What it does |
| --- | --- |
| Dashboard | Balances and recent activity |
| Portfolio | ERC-20 holdings, via the Alchemy SDK |
| Transfer | Send to a username or address |
| Requests | Payment requests sent and received, with their state machine |
| Contacts | Friend graph — send, accept, reject, cancel |
| Swap | Token swap — **UI scaffolded; the engine is server-side (see below)** |

## Status

Auth, portfolio, transfers, requests, and the friend graph work end to end
against the deployed Lambdas.

**Swap is not wired up.** [`src/pages/Swap.jsx`](src/pages/Swap.jsx) is the form
only — the quote and calldata engine is complete in
[`vault-payments/swap/`](https://github.com/einjun03/vaultin-backend/tree/main/vault-payments/swap)
and exposed at `POST /txns/get-quote`, but this page doesn't call it yet. The
backend is where the interesting work is.

---

## Running it

**Prerequisites** — Node 18+, a browser wallet, and keys for Alchemy and
WalletConnect.

```bash
git clone https://github.com/einjun03/vaultin_frontend
cd vaultin_frontend
npm install
```

Create `.env`:

```bash
VITE_ALCHEMY_API_KEY=            # alchemy.com
VITE_WALLETCONNECT_PROJECT_ID=   # cloud.reown.com
VITE_AUTH_LAMBDA=                # deployed API Gateway URL, no trailing slash
```

```bash
npm run dev      # localhost:5173
```

> These are **build-time** variables. Vite inlines `VITE_*` into the bundle when
> `vite build` runs, so a deployment needs them set on the host — a local `.env`
> has no effect on a deployed site.

You need the backend running for anything past the landing page. Deploy it from
[vaultin-backend](https://github.com/einjun03/vaultin-backend) with
`sam deploy --guided`, then point `VITE_AUTH_LAMBDA` at the API Gateway URL.

## Layout

```
src/
  Web3Provider.jsx        wagmi + ConnectKit config, chain setup
  Layout.jsx              app shell
  contexts/
    CryptoDataContext.jsx shared token/price state
  pages/
    LandingPage.jsx  Dashboard.jsx  Portfolio.jsx
    Transfer.jsx     Requests.jsx   Contacts.jsx   Swap.jsx
  components/
    Navbar.jsx  Sidebar.jsx  TokenRow.jsx  RegisterModal.jsx
  utils/
    useAuth.js            SIWE nonce → sign → verify → session
    config.js             chain + client config
    constants.js          supported networks and tokens
```

## Deploying

Vercel. `VITE_*` variables must be set in the project's environment settings —
the build inlines them.

```bash
vercel link
vercel env add VITE_ALCHEMY_API_KEY production
vercel env add VITE_WALLETCONNECT_PROJECT_ID production
vercel env add VITE_AUTH_LAMBDA production
vercel --prod
```

---

Notes kept from earlier work: [`docs/label-categorization.md`](docs/label-categorization.md).
