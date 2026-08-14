import { openDB } from 'idb';
import { KNOWN_ADDRESSES_FLAT } from './constants';
import { NETWORKS, batchRpc } from './balances';

// Labels the other side of a transfer.
//
// The feed previously showed every non-contact counterparty as "External" plus
// an address, so a Uniswap swap and a payment to a stranger looked the same.
// Two tiers of improvement, cheapest first:
//
//   1. KNOWN_ADDRESSES — a named protocol or exchange ("Uniswap", "Coinbase")
//   2. eth_getCode     — at minimum, "Contract" rather than "External"
//
// Contacts are resolved earlier, in the component, and never reach this.

const db = await openDB('counterparties', 1, {
  upgrade(database) {
    // key: "network:address" → 'contract' | 'wallet'
    database.createObjectStore('kind');
  },
});

const cacheKey = (network, address) => `${network}:${address.toLowerCase()}`;

/**
 * Named label for an address, or null if we have no name for it.
 * Synchronous — this is a static map lookup, safe to call during render.
 */
export function knownLabel(address) {
  if (!address) return null;
  return KNOWN_ADDRESSES_FLAT[address.toLowerCase()] || null;
}

/**
 * Resolve 'contract' | 'wallet' for each address on one network, consulting the
 * cache first and batching whatever remains into a single RPC request.
 *
 * Deployed code does not come and go, so results are cached indefinitely. A
 * failed lookup is simply omitted rather than cached, so it is retried later
 * instead of being remembered as a wrong answer.
 */
export async function resolveAddressKinds(networkId, addresses) {
  const unique = [...new Set(addresses.filter(Boolean).map((a) => a.toLowerCase()))];
  const out = {};
  const missing = [];

  for (const addr of unique) {
    const cached = await db.get('kind', cacheKey(networkId, addr));
    if (cached) out[addr] = cached;
    else missing.push(addr);
  }

  if (missing.length === 0) return out;

  const network = NETWORKS.find((n) => n.id === networkId);
  if (!network) return out;

  try {
    const codes = await batchRpc(
      network.rpcUrl,
      missing.map((addr) => ({ method: 'eth_getCode', params: [addr, 'latest'] }))
    );

    const tx = db.transaction('kind', 'readwrite');
    missing.forEach((addr, i) => {
      const code = codes[i];
      // undefined means the call failed; leave it unresolved so it retries
      if (typeof code !== 'string') return;
      const kind = code === '0x' ? 'wallet' : 'contract';
      out[addr] = kind;
      tx.store.put(kind, cacheKey(networkId, addr));
    });
    await tx.done;
  } catch (err) {
    console.warn('Failed to resolve counterparty kinds:', err);
  }

  return out;
}

/**
 * What to show for a counterparty, given an optional resolved kind.
 * Falls back to "External" when the kind is not known yet, matching the
 * previous behaviour rather than flickering through a placeholder.
 */
export function counterpartyLabel(address, kind) {
  const named = knownLabel(address);
  if (named) return named;
  if (kind === 'contract') return 'Contract';
  return 'External';
}
