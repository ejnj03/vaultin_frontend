
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { TokenCard, TokenCardSkeleton } from '../components/TokenCard';

const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

const NETWORKS = [
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
];

// Send a batch of JSON-RPC calls in a single HTTP request
async function batchRpc(rpcUrl, calls) {
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
  // Step 1: Batch native balance + ERC20 balances
  const [nativeBalanceHex, tokenBalancesResult] = await batchRpc(network.rpcUrl, [
    { method: 'eth_getBalance', params: [address, 'latest'] },
    { method: 'alchemy_getTokenBalances', params: [address] },
  ]);

  const tokens = [];

  // Add native token if non-zero
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

  // Filter non-zero ERC20 balances
  const nonZero = (tokenBalancesResult?.tokenBalances || []).filter(
    b => BigInt(b.tokenBalance) > 0n
  );

  if (nonZero.length === 0) return tokens;

  // Step 2: Batch metadata for all non-zero tokens
  const metadataResults = await batchRpc(
    network.rpcUrl,
    nonZero.map(b => ({ method: 'alchemy_getTokenMetadata', params: [b.contractAddress] }))
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

function MyERC20() {
  const [isChecking, setIsChecking] = useState(true);
  const { address, isConnected } = useAccount();
  const [networkTokens, setNetworkTokens] = useState({});
  const [loadingNetworks, setLoadingNetworks] = useState(new Set());
  const [selectedNetwork, setSelectedNetwork] = useState('all');

  async function fetchAll() {
    const allLoading = new Set(NETWORKS.map(n => n.id));
    setLoadingNetworks(allLoading);

    // Accumulate results locally for caching (avoids reading state)
    const results = {};

    // Fetch each network in parallel, update state progressively
    const promises = NETWORKS.map(async (network) => {
      try {
        const tokens = await fetchNetworkTokens(network, address);
        results[network.id] = tokens;
        setNetworkTokens(prev => ({ ...prev, [network.id]: tokens }));
      } catch (err) {
        console.error(`Failed to fetch ${network.name}:`, err);
        results[network.id] = [];
        setNetworkTokens(prev => ({ ...prev, [network.id]: [] }));
      } finally {
        setLoadingNetworks(prev => {
          const next = new Set(prev);
          next.delete(network.id);
          return next;
        });
      }
    });

    await Promise.all(promises);

    // Cache results from local variable
    const cacheKey = `portfolio_v2_${address}`;
    const serializable = {};
    for (const [nid, tokens] of Object.entries(results)) {
      serializable[nid] = tokens.map(({ network, ...rest }) => ({ ...rest, networkId: network.id }));
    }
    localStorage.setItem(cacheKey, JSON.stringify(serializable));
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsChecking(false), 1000);

    if (isConnected && address) {
      // Clear previous account's data immediately
      setNetworkTokens({});

      // Try loading cache for this address
      const cacheKey = `portfolio_v2_${address}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Reattach network objects
          const restored = {};
          for (const [nid, tokens] of Object.entries(parsed)) {
            const network = NETWORKS.find(n => n.id === nid);
            if (network) {
              restored[nid] = tokens.map(t => ({ ...t, network, networkId: undefined }));
            }
          }
          setNetworkTokens(restored);
        } catch { /* ignore corrupt cache */ }
      }

      fetchAll();
    } else {
      // Wallet disconnected — clear state
      setNetworkTokens({});
    }

    return () => clearTimeout(timer);
  }, [isConnected, address]);

  // Derived state
  const allTokens = Object.values(networkTokens).flat();
  const filteredTokens = selectedNetwork === 'all'
    ? allTokens
    : networkTokens[selectedNetwork] || [];
  const isLoading = loadingNetworks.size > 0;
  const tokenCount = allTokens.length;
  const networksWithHoldings = NETWORKS.filter(n => (networkTokens[n.id] || []).length > 0);
  const truncatedAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-[1200px] mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-base-content/40 mt-1">Multi-chain token balances</p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-base-200 rounded-full py-2 px-4 border border-base-content/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="font-mono text-sm text-base-content/60">{truncatedAddr}</span>
            </div>
            <button
              onClick={() => fetchAll()}
              disabled={isLoading}
              className="btn btn-ghost btn-sm btn-square border border-base-content/10 hover:border-primary/30"
              title="Refresh balances"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M20.015 4.172v4.992" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Not connected */}
      {!isConnected && !isChecking ? (
        <div className="bg-base-200 rounded-box border border-base-content/5 flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-base-300 border border-base-content/10 flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-base-content/30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-base-content/70 mb-2">No Wallet Connected</h2>
          <p className="text-sm text-base-content/40 text-center max-w-xs">Connect your wallet to view your multi-chain portfolio.</p>
        </div>
      ) : !isConnected && isChecking ? (
        <div className="bg-base-200 rounded-box border border-base-content/5 flex flex-col items-center justify-center py-20 px-6">
          <span className="loading loading-dots loading-lg text-primary mb-4"></span>
          <h2 className="text-xl font-bold text-base-content/70 mb-2">Detecting Wallet...</h2>
          <p className="text-sm text-base-content/40">Looking for a connected wallet provider.</p>
        </div>
      ) : isLoading && tokenCount === 0 ? (
        /* Initial loading — no cached data */
        <div className="bg-base-200 rounded-box border border-base-content/5 flex flex-col items-center justify-center py-20 px-6">
          <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
          <h2 className="text-xl font-bold text-base-content/70 mb-2">Fetching Balances...</h2>
          <p className="text-sm text-base-content/40">Scanning {NETWORKS.length} networks for your holdings.</p>
          {/* Per-network progress */}
          <div className="flex items-center gap-3 mt-6">
            {NETWORKS.map(n => (
              <div key={n.id} className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${loadingNetworks.has(n.id) ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: loadingNetworks.has(n.id) ? n.color + '60' : n.color }}
                ></span>
                <span className={`text-xs ${loadingNetworks.has(n.id) ? 'text-base-content/30' : 'text-base-content/60'}`}>
                  {n.shortName}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-base-200 rounded-box p-5 border border-base-content/5">
              <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-primary">{allTokens.length}</p>
            </div>
            <div className="bg-base-200 rounded-box p-5 border border-base-content/5">
              <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium mb-2">Networks</p>
              <div className="flex items-center gap-2">
                {NETWORKS.map(n => {
                  const hasHoldings = (networkTokens[n.id] || []).length > 0;
                  return (
                    <div key={n.id} className="tooltip tooltip-bottom" data-tip={`${n.name}${hasHoldings ? '' : ' (no holdings)'}`}>
                      <span
                        className={`inline-block w-3 h-3 rounded-full transition-opacity ${hasHoldings ? '' : 'opacity-20'}`}
                        style={{ backgroundColor: n.color }}
                      ></span>
                    </div>
                  );
                })}
                <span className="text-sm font-bold text-base-content ml-1">
                  {networksWithHoldings.length}/{NETWORKS.length}
                </span>
              </div>
            </div>
            <div className="bg-base-200 rounded-box p-5 border border-base-content/5">
              <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium mb-1">Status</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${isLoading ? 'text-warning' : 'text-success'}`}>
                  {isLoading ? 'Syncing' : 'Synced'}
                </p>
                {isLoading && <span className="loading loading-spinner loading-xs text-warning"></span>}
              </div>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-base-200 rounded-box border border-base-content/5 overflow-hidden">
            {/* Table header with network filter tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-base-content/5 gap-3">
              <h2 className="font-bold text-lg">Holdings</h2>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setSelectedNetwork('all')}
                  className={`btn btn-xs rounded-full ${selectedNetwork === 'all' ? 'btn-primary' : 'btn-ghost text-base-content/40'}`}
                >
                  All ({allTokens.length})
                </button>
                {NETWORKS.map(n => {
                  const count = (networkTokens[n.id] || []).length;
                  if (count === 0 && !loadingNetworks.has(n.id)) return null;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNetwork(n.id)}
                      className={`btn btn-xs rounded-full gap-1.5 ${selectedNetwork === n.id ? 'btn-primary' : 'btn-ghost text-base-content/40'}`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: n.color }}></span>
                      {n.shortName}
                      {loadingNetworks.has(n.id) ? (
                        <span className="loading loading-spinner" style={{ width: '10px', height: '10px' }}></span>
                      ) : (
                        <span>({count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-content/5">
                    <th className="text-xs text-base-content/40 uppercase tracking-wider font-medium px-6 py-3">Token</th>
                    <th className="text-xs text-base-content/40 uppercase tracking-wider font-medium px-6 py-3 hidden sm:table-cell">Network</th>
                    <th className="text-xs text-base-content/40 uppercase tracking-wider font-medium px-6 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.length > 0 ? (
                    filteredTokens.map((token) => (
                      <TokenCard key={`${token.network.id}_${token.contractAddress}`} token={token} />
                    ))
                  ) : isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <TokenCardSkeleton key={i} />)
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-base-content/40">
                        No tokens found on {selectedNetwork === 'all' ? 'any network' : NETWORKS.find(n => n.id === selectedNetwork)?.name}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Loading indicator for background refresh */}
            {isLoading && filteredTokens.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-3 border-t border-base-content/5 text-xs text-base-content/40">
                <span className="loading loading-spinner loading-xs text-primary"></span>
                Refreshing {loadingNetworks.size} network{loadingNetworks.size !== 1 ? 's' : ''}...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MyERC20;
