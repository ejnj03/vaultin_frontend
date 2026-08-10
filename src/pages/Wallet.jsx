
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Utils } from 'alchemy-sdk';
import { ChevronDown } from 'lucide-react';
import { TokenCard, TokenCardSkeleton } from '../components/wallet/TokenCard';
import TransactionHistory from '../components/wallet/TransactionHistory';
import { useCryptoData } from '../contexts/CryptoDataContext';
import { NETWORKS, getCachedBalances, fetchAllBalances } from '../utils/balances';

function Wallet() {
  const [isChecking, setIsChecking] = useState(true);
  const { address, isConnected } = useAccount();
  const [networkTokens, setNetworkTokens] = useState({});
  const [loadingNetworks, setLoadingNetworks] = useState(new Set());
  const [selectedNetwork, setSelectedNetwork] = useState('byToken');
  const { data: cryptoData } = useCryptoData();

  const priceMap = cryptoData || {};

  async function fetchAll() {
    setLoadingNetworks(new Set(NETWORKS.map(n => n.id)));

    await fetchAllBalances(address, (networkId, tokens) => {
      setNetworkTokens(prev => ({ ...prev, [networkId]: tokens }));
      setLoadingNetworks(prev => {
        const next = new Set(prev);
        next.delete(networkId);
        return next;
      });
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsChecking(false), 1000);

    if (isConnected && address) {
      setNetworkTokens({});

      const cached = getCachedBalances(address);
      if (cached) setNetworkTokens(cached);

      fetchAll();
    } else {
      setNetworkTokens({});
    }

    return () => clearTimeout(timer);
  }, [isConnected, address]);

  // Derived state
  const allTokens = Object.values(networkTokens).flat();
  const isLoading = loadingNetworks.size > 0;

  // "By Token" view: aggregate same-symbol tokens across networks
  const aggregatedTokens = useMemo(() => {
    const bySymbol = new Map();
    for (const token of allTokens) {
      const sym = token.symbol.toUpperCase();
      if (!bySymbol.has(sym)) {
        bySymbol.set(sym, {
          ...token,
          // Sum balances as human-readable (different decimals across networks)
          _humanBalance: parseFloat(Utils.formatUnits(token.balance, token.decimals)),
          _networks: [token.network],
        });
      } else {
        const existing = bySymbol.get(sym);
        existing._humanBalance += parseFloat(Utils.formatUnits(token.balance, token.decimals));
        existing._networks.push(token.network);
      }
    }
    return [...bySymbol.values()];
  }, [allTokens]);

  const filteredTokens = selectedNetwork === 'byToken'
    ? aggregatedTokens
    : selectedNetwork === 'byNetwork'
      ? allTokens
      : networkTokens[selectedNetwork] || [];

  const { pricedTokens, unpricedTokens } = useMemo(() => {
    const priced = [];
    const unpriced = [];
    for (const token of filteredTokens) {
      const price = priceMap[token.symbol.toLowerCase()]?.usd;
      const humanBal = token._humanBalance != null
        ? token._humanBalance
        : parseFloat(Utils.formatUnits(token.balance, token.decimals));
      if (price) {
        priced.push({ token, val: humanBal * price });
      } else {
        unpriced.push(token);
      }
    }
    priced.sort((a, b) => b.val - a.val);
    return { pricedTokens: priced.map(p => p.token), unpricedTokens: unpriced };
  }, [filteredTokens, priceMap]);
  const [showUnpriced, setShowUnpriced] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const tokenCount = allTokens.length;
  const truncatedAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // Compute human-readable token balances per network (for running balance column)
  const perNetworkBalances = useMemo(() => {
    const result = {};
    for (const [networkId, tokens] of Object.entries(networkTokens)) {
      const balances = {};
      for (const token of tokens) {
        const humanBalance = parseFloat(Utils.formatUnits(token.balance, token.decimals));
        balances[token.symbol.toUpperCase()] = humanBalance;
      }
      result[networkId] = balances;
    }
    return result;
  }, [networkTokens]);

  const totalValue = useMemo(() => {
    if (allTokens.length === 0) return null;
    let total = 0;
    let hasAnyPrice = false;
    for (const token of allTokens) {
      const price = priceMap[token.symbol.toLowerCase()]?.usd;
      if (price) {
        const humanBalance = parseFloat(Utils.formatUnits(token.balance, token.decimals));
        total += humanBalance * price;
        hasAnyPrice = true;
      }
    }
    return hasAnyPrice ? total : null;
  }, [allTokens, priceMap]);

  const formatTotal = (val) => {
    if (val == null) return '—';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Resizable panel logic
  const [leftPct, setLeftPct] = useState(30); // left panel starts at min size
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(80, Math.max(30, pct)));
    };
    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">

      {/* Not connected / checking / initial loading */}
      {!isConnected && !isChecking ? (
        <div className="max-w-lg mx-auto bg-base-200 rounded-box border border-base-content/5 flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-base-300 border border-base-content/10 flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-base-content/30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-base-content/70 mb-2">No Wallet Connected</h2>
          <p className="text-sm text-base-content/40 text-center max-w-xs">Connect your wallet to view your balances.</p>
        </div>
      ) : !isConnected && isChecking ? (
        <div className="max-w-lg mx-auto bg-base-200 rounded-box border border-base-content/5 flex flex-col items-center justify-center py-20 px-6">
          <span className="loading loading-dots loading-lg text-primary mb-4"></span>
          <h2 className="text-xl font-bold text-base-content/70 mb-2">Detecting Wallet...</h2>
          <p className="text-sm text-base-content/40">Looking for a connected wallet provider.</p>
        </div>
      ) : isLoading && tokenCount === 0 ? (
        <div className="max-w-lg mx-auto bg-base-200 rounded-box border border-base-content/5 flex flex-col items-center justify-center py-20 px-6">
          <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
          <h2 className="text-xl font-bold text-base-content/70 mb-2">Fetching Balances...</h2>
          <p className="text-sm text-base-content/40">Scanning {NETWORKS.length} networks for your holdings.</p>
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
        <div ref={containerRef} className="flex flex-col lg:flex-row h-[calc(100vh-96px)]">

          {/* Portfolio Panel — collapsible on mobile, side panel on desktop */}
          <div className="portfolio-panel bg-base-200 rounded-box border border-base-content/5 w-full flex flex-col overflow-hidden shrink-0" style={{ '--panel-pct': `${leftPct}%` }}>
            {/* Balance header — always visible, acts as collapse trigger on mobile */}
            <button
              type="button"
              onClick={() => setPortfolioOpen(p => !p)}
              className="p-5 border-b border-base-content/5 shrink-0 w-full text-left lg:pointer-events-none"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium">Total Balance</p>
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <span className="loading loading-spinner loading-xs text-primary"></span>
                  )}
                  <span
                    onClick={(e) => { e.stopPropagation(); fetchAll(); }}
                    className="btn btn-ghost btn-xs btn-square pointer-events-auto"
                    title="Refresh balances"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M20.015 4.172v4.992" />
                    </svg>
                  </span>
                  {/* Collapse chevron — mobile only */}
                  <ChevronDown size={14} strokeWidth={1.75} className={`text-white/30 transition-transform lg:hidden ${portfolioOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-primary tracking-tight mb-3">
                {formatTotal(totalValue)}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-base-300/50 rounded-full py-1 px-2.5">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                  </span>
                  <span className="font-mono text-[11px] text-base-content/50">{truncatedAddr}</span>
                </div>
                <span className="text-[11px] text-base-content/30">{allTokens.length} asset{allTokens.length !== 1 ? 's' : ''}</span>
              </div>
            </button>

            {/* Collapsible body — hidden on mobile when collapsed, always visible on desktop */}
            <div className={`flex-col flex-1 min-h-0 overflow-hidden ${portfolioOpen ? 'flex' : 'hidden'} lg:flex`}>
              {/* Network filter */}
              <div className="px-4 py-3 border-b border-base-content/5 shrink-0 space-y-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedNetwork('byToken')}
                    className={`btn btn-xs rounded-full ${selectedNetwork === 'byToken' ? 'btn-primary' : 'btn-ghost text-base-content/40'}`}
                  >
                    All Tokens
                  </button>
                  <button
                    onClick={() => setSelectedNetwork('byNetwork')}
                    className={`btn btn-xs rounded-full ${selectedNetwork === 'byNetwork' ? 'btn-primary' : 'btn-ghost text-base-content/40'}`}
                  >
                    All Networks
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {NETWORKS.map(n => {
                    const count = (networkTokens[n.id] || []).filter(t => priceMap[t.symbol.toLowerCase()]?.usd).length;
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

              {/* Token list (scrollable) — limited height on mobile */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[55vh] lg:max-h-none">
                {pricedTokens.length > 0 || unpricedTokens.length > 0 ? (
                  <>
                    {pricedTokens.map((token) => (
                      <TokenCard
                        key={token._humanBalance != null ? `agg_${token.symbol}` : `${token.network.id}_${token.contractAddress}`}
                        token={token}
                        priceData={priceMap[token.symbol.toLowerCase()] || null}
                        aggregated={token._humanBalance != null}
                      />
                    ))}
                    {unpricedTokens.length > 0 && (
                      <>
                        <button
                          onClick={() => setShowUnpriced(p => !p)}
                          className="flex items-center gap-2 w-full text-left px-1 py-2 text-sm text-base-content/40 hover:text-base-content/60 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                            className={`w-3.5 h-3.5 transition-transform ${showUnpriced ? 'rotate-90' : ''}`}
                          >
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                          Hidden tokens ({unpricedTokens.length}) &middot; no price data
                        </button>
                        {showUnpriced && unpricedTokens.map((token) => (
                          <TokenCard
                            key={token._humanBalance != null ? `agg_${token.symbol}` : `${token.network.id}_${token.contractAddress}`}
                            token={token}
                            priceData={null}
                            aggregated={token._humanBalance != null}
                          />
                        ))}
                      </>
                    )}
                  </>
                ) : isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <TokenCardSkeleton key={i} />)
                ) : (
                  <div className="text-center py-10 text-sm text-base-content/40">
                    No tokens found{selectedNetwork !== 'byToken' && selectedNetwork !== 'byNetwork' ? ` on ${NETWORKS.find(n => n.id === selectedNetwork)?.name || selectedNetwork}` : ''}.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drag handle — desktop only */}
          <div
            onMouseDown={onMouseDown}
            className="hidden lg:flex items-center justify-center w-3 shrink-0 cursor-col-resize group"
          >
            <div className="w-0.5 h-8 rounded-full bg-base-content/10 group-hover:bg-primary/40 group-active:bg-primary transition-colors"></div>
          </div>

          {/* Transactions Panel — primary content */}
          <div className="flex-1 min-w-0 bg-base-200/60 rounded-box border border-base-content/5 flex flex-col overflow-hidden mt-4 lg:mt-0">
            <TransactionHistory tokenBalances={perNetworkBalances} />
          </div>

        </div>
      )}
    </div>
  );
}

export default Wallet;
