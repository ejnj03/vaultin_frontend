import { useState, useRef, useEffect, useMemo } from 'react';
import { SUPPORTED_TOKENS } from '../../../utils/constants';
import { NETWORK_LOGOS, NETWORK_NAMES, TOKEN_LOGOS } from '../../../utils/networkLogos';
import { getTokenBalance } from '../../../utils/balances';
import { fromBaseUnits, displayAmount, toUsdRaw, toUsdForBalance } from '../../../utils/tokenUtils';

export default function AssetSelector({ network, token, onNetworkChange, onTokenChange, label, address, prices }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(network ? 'token' : 'network');
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setStep(network ? 'token' : 'network');
    setSearch('');
    setOpen(!open);
  };

  const selectNetwork = (n) => {
    onNetworkChange(n);
    onTokenChange('');
    setStep('token');
  };

  const selectToken = (t) => {
    onTokenChange(t);
    setOpen(false);
  };

  const networks = Object.keys(SUPPORTED_TOKENS);
  const tokens = network ? SUPPORTED_TOKENS[network] : [];
  const hasSelection = network && token;

  // Network total USD balances
  const networkBalances = useMemo(() => {
    if (!address || !prices) return {};
    const result = {};
    for (const n of networks) {
      let total = 0;
      for (const t of SUPPORTED_TOKENS[n]) {
        const bal = getTokenBalance(address, n, t);
        if (bal && bal !== '0') {
          const usd = toUsdRaw(fromBaseUnits(bal, t), t, prices);
          if (usd != null) total += usd;
        }
      }
      result[n] = total;
    }
    return result;
  }, [address, prices, open]);

  // Token balances for selected network
  const tokenBalances = useMemo(() => {
    if (!address || !network) return {};
    const result = {};
    for (const t of tokens) {
      const bal = getTokenBalance(address, network, t);
      result[t] = bal || '0';
    }
    return result;
  }, [address, network, open]);

  // Sort networks by total USD balance descending
  const sortedNetworks = useMemo(() => {
    return [...networks].sort((a, b) => (networkBalances[b] || 0) - (networkBalances[a] || 0));
  }, [networks, networkBalances]);

  // Sort tokens by USD value descending (largest balance first)
  const sortedTokens = useMemo(() => {
    return [...tokens].sort((a, b) => {
      const balA = tokenBalances[a] || '0';
      const balB = tokenBalances[b] || '0';
      const usdA = balA !== '0' && prices ? (toUsdRaw(fromBaseUnits(balA, a), a, prices) ?? 0) : 0;
      const usdB = balB !== '0' && prices ? (toUsdRaw(fromBaseUnits(balB, b), b, prices) ?? 0) : 0;
      return usdB - usdA;
    });
  }, [tokens, tokenBalances, prices]);

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center justify-center gap-1.5 rounded-full h-8 px-2.5 text-sm leading-none font-semibold whitespace-nowrap bg-base-content/8 hover:bg-base-content/12 text-base-content transition-colors"
      >
        {hasSelection ? (
          <>
            <div className="relative">
              <img src={TOKEN_LOGOS[token] || NETWORK_LOGOS[network]} className="w-5 h-5 rounded-full" alt={token} />
              <img src={NETWORK_LOGOS[network]} className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-base-300" alt={network} />
            </div>
            <span>{token}</span>
          </>
        ) : (
          <span className="text-base-content/50">{label || 'Select token'}</span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-base-content/30">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-base-100 border border-base-content/10 rounded-2xl z-50 py-2 overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: '280px', overflowY: 'auto' }}>
          {step === 'network' ? (
            <>
              <p className="text-[10px] text-base-content/30 font-semibold uppercase tracking-wider px-4 py-1.5">Select network</p>
              {sortedNetworks.map((n) => {
                const netUsd = networkBalances[n];
                const netUsdDisplay = netUsd > 0 ? (netUsd < 0.01 ? '<$0.01' : `$${netUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : null;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => selectNetwork(n)}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-left transition-colors ${
                      n === network ? 'bg-primary/10 text-primary' : 'hover:bg-base-content/5'
                    }`}
                  >
                    <img src={NETWORK_LOGOS[n]} className="w-7 h-7 rounded-full" alt={n} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{NETWORK_NAMES[n]}</span>
                      {netUsdDisplay && <p className="text-[10px] text-base-content/30 tabular-nums">{netUsdDisplay}</p>}
                    </div>
                    {n === network && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('network')}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-[10px] text-base-content/30 hover:bg-base-content/5 hover:text-base-content/50 uppercase tracking-wider font-semibold rounded-md cursor-pointer transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                <img src={NETWORK_LOGOS[network]} className="w-3.5 h-3.5 rounded-full" alt={network} />
                {NETWORK_NAMES[network]}
              </button>
              <input
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-base-content/5 border-b border-base-content/10 px-4 py-2 text-sm text-base-content outline-none placeholder:text-base-content/20"
              />
              {sortedTokens.filter(t => !search || t.toLowerCase().includes(search.toLowerCase())).map((t) => {
                const bal = tokenBalances[t] || '0';
                const balDisplay = bal !== '0' ? displayAmount(bal, t) : null;
                const balUsd = bal !== '0' && prices ? toUsdForBalance(fromBaseUnits(bal, t), t, prices) : null;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => selectToken(t)}
                    className={`flex items-center justify-between gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                      t === token ? 'bg-primary/10 text-primary' : 'hover:bg-base-content/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={TOKEN_LOGOS[t] || NETWORK_LOGOS[network]} className="w-7 h-7 rounded-full" alt={t} />
                      <span className="text-sm font-medium">{t}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {balDisplay && (
                        <span className="text-sm tabular-nums text-right text-base-content/60">
                          {balDisplay} {t}
                        </span>
                      )}
                      {t === token && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
