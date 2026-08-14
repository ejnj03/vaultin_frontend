const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

export const NETWORKS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'ETH',
    nativeSymbol: 'ETH',
    nativeName: 'Ethereum',
    nativeDecimals: 18,
    rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    color: '#627EEA',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    shortName: 'POL',
    nativeSymbol: 'POL',
    nativeName: 'Polygon',
    nativeDecimals: 18,
    rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    color: '#8247E5',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    shortName: 'ARB',
    nativeSymbol: 'ETH',
    nativeName: 'Ethereum',
    nativeDecimals: 18,
    rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    color: '#12AAFF',
  },
  {
    id: 'optimism',
    name: 'Optimism',
    shortName: 'OP',
    nativeSymbol: 'ETH',
    nativeName: 'Ethereum',
    nativeDecimals: 18,
    rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    color: '#FF0420',
  },
  {
    id: 'base',
    name: 'Base',
    shortName: 'BASE',
    nativeSymbol: 'ETH',
    nativeName: 'Ethereum',
    nativeDecimals: 18,
    rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    color: '#0052FF',
  },
];

// Send a batch of JSON-RPC calls in a single HTTP request
export async function batchRpc(rpcUrl, calls) {
  if (calls.length === 0) return [];
  const body = calls.map((call, i) => ({
    jsonrpc: '2.0',
    id: i,
    method: call.method,
    params: call.params,
  }));
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const results = await res.json();
  return Array.isArray(results)
    ? results.sort((a, b) => a.id - b.id).map(r => r.result)
    : [results.result];
}

// Fetch native + ERC20 balances for a single network
async function fetchNetworkTokens(network, address) {
  const [nativeBalanceHex] = await batchRpc(network.rpcUrl, [
    { method: 'eth_getBalance', params: [address, 'latest'] },
  ]);

  const tokenRes = await fetch(network.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'alchemy_getTokenBalances', params: [address] }),
  });
  const tokenBalancesResult = (await tokenRes.json()).result;

  const tokens = [];

  if (nativeBalanceHex && BigInt(nativeBalanceHex) > 0n) {
    tokens.push({
      contractAddress: `native_${network.id}`,
      name: network.nativeName,
      symbol: network.nativeSymbol,
      decimals: network.nativeDecimals,
      logo: null,
      balance: nativeBalanceHex,
      network,
      isNative: true,
    });
  }

  const nonZero = (tokenBalancesResult?.tokenBalances || []).filter(
    b => BigInt(b.tokenBalance) > 0n
  );

  if (nonZero.length === 0) return tokens;

  const metadataResults = await Promise.all(
    nonZero.map(async (b) => {
      const res = await fetch(network.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'alchemy_getTokenMetadata', params: [b.contractAddress] }),
      });
      return (await res.json()).result;
    })
  );

  nonZero.forEach((b, i) => {
    const meta = metadataResults[i];
    if (meta) {
      tokens.push({
        contractAddress: b.contractAddress,
        name: meta.name || 'Unknown Token',
        symbol: meta.symbol || '???',
        decimals: meta.decimals ?? 18,
        logo: meta.logo || null,
        balance: b.tokenBalance,
        network,
        isNative: false,
      });
    }
  });

  return tokens;
}

// Restore cached balances from localStorage
export function getCachedBalances(address) {
  const cacheKey = `wallet_v2_${address}`;
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    const restored = {};
    for (const [nid, tokens] of Object.entries(parsed)) {
      const network = NETWORKS.find(n => n.id === nid);
      if (network) {
        restored[nid] = tokens.map(t => ({ ...t, network, networkId: undefined }));
      }
    }
    return restored;
  } catch {
    return null;
  }
}

// Look up a specific token's balance in base units (e.g. wei).
// Returns a base-unit string, or '0' if not found.
export function getTokenBalance(address, networkId, tokenSymbol) {
  const balances = getCachedBalances(address);
  if (!balances || !balances[networkId]) return '0';
  const token = balances[networkId].find(
    t => t.symbol.toUpperCase() === tokenSymbol.toUpperCase()
  );
  if (!token) return '0';
  return BigInt(token.balance).toString();
}

// Fetch fresh balances for all networks, calling onUpdate progressively as each network resolves.
// Returns the final combined results object keyed by network id.
export async function fetchAllBalances(address, onUpdate) {
  const results = {};

  const promises = NETWORKS.map(async (network) => {
    try {
      const tokens = await fetchNetworkTokens(network, address);
      results[network.id] = tokens;
    } catch (err) {
      console.error(`Failed to fetch ${network.name}:`, err);
      results[network.id] = [];
    }
    if (onUpdate) onUpdate(network.id, results[network.id]);
  });

  await Promise.all(promises);

  // Save to localStorage
  const cacheKey = `wallet_v2_${address}`;
  const serializable = {};
  for (const [nid, tokens] of Object.entries(results)) {
    serializable[nid] = tokens.map(({ network, ...rest }) => ({ ...rest, networkId: network.id }));
  }
  localStorage.setItem(cacheKey, JSON.stringify(serializable));

  return results;
}
