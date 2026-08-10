import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useCryptoData } from '../../contexts/CryptoDataContext';
import { useUser } from '../../contexts/UserContext';
import { alchemyInstances, GAS_FEE_LIMIT } from '../../utils/alchemy';
import { computeRunningBalances, computeAggregateRunningBalances } from '../../utils/transferProcessing';
import { get_transfers, update_gas_fees } from '../../utils/txn_history';
import { timeAgo, fmtAmount, fmtAmount6, fmtUsd, truncateAddr } from '../../utils/formatting';
import { useApi } from '../../hooks/useApi';
import blockies from 'ethereum-blockies-base64';
import TokenIcon from './TokenIcon';
import TxDetailModal from './TxDetailModal';

const STATUS_STYLES = {
  confirmed: 'badge-success',
  submitted: 'badge-warning',
  failed: 'badge-error',
};

function TxSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 px-4 py-3.5">
      <div className="h-3.5 bg-base-content/10 rounded w-12" />
      <div className="h-3.5 bg-base-content/10 rounded w-20" />
      <div className="h-3.5 bg-base-content/10 rounded w-16" />
      <div className="flex-1" />
      <div className="h-3.5 bg-base-content/10 rounded w-20" />
      <div className="h-3.5 bg-base-content/10 rounded w-24" />
    </div>
  );
}

export default function TransactionHistory({ tokenBalances }) {
  const [transfers, setTransfers] = useState([]);
  const [gasFees, setGasFees] = useState({});
  const [tokenLogos, setTokenLogos] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [selectedTx, setSelectedTx] = useState(null);
  const { address } = useAccount();
  const { contactProfiles } = useUser();
  const { data: cryptoData } = useCryptoData();
  const { apiCall } = useApi();
  const priceMap = cryptoData || {};

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    let mounted = true;

    (async () => {
      try {
        // 1. IDB cache-first fetch (onUpdate fires with cached, then fresh)
        const { merged, sentAlchemy, receivedAlchemy } = await get_transfers(apiCall, address, (data) => {
          if (!mounted) return;
          setTransfers(data);
          // Extract cached gas fees from IDB rows (keyed by network:hash)
          const cachedFees = {};
          for (const t of data) { if (t.gasFee != null) cachedFees[`${t.network || 'ethereum'}:${t.hash}`] = t.gasFee; }
          if (Object.keys(cachedFees).length > 0) setGasFees(cachedFees);
          setLoading(false);
        });
        if (!mounted) return;

        // 2. Fetch token logos via getTokenMetadata for unique contracts (use ethereum instance as primary)
        const uniqueContracts = new Map();
        [...sentAlchemy.transfers, ...receivedAlchemy.transfers].forEach(t => {
          if (t.rawContract?.address && t.asset && !uniqueContracts.has(t.rawContract.address))
            uniqueContracts.set(t.rawContract.address, t.asset);
        });

        const logos = {};
        const ethAlchemy = alchemyInstances.ethereum;
        await Promise.all([...uniqueContracts.entries()].slice(0, 30).map(async ([addr, symbol]) => {
          try {
            const meta = await ethAlchemy.core.getTokenMetadata(addr);
            if (meta?.logo) logos[symbol.toUpperCase()] = meta.logo;
          } catch { /* skip */ }
        }));
        if (!mounted) return;
        setTokenLogos(logos);

        // 3. Fetch gas fees only for txns not already cached (per-network)
        const gasEligible = merged
          .filter(t => (t.direction === 'sent' || t.direction === 'swapped') && t.status !== 'submitted' && t.gasFee == null)
          .slice(0, GAS_FEE_LIMIT);

        if (gasEligible.length > 0) {
          const fees = {};
          await Promise.all(gasEligible.map(async (tx) => {
            try {
              const net = tx.network || 'ethereum';
              const alchemy = alchemyInstances[net];
              if (!alchemy) return;
              const receipt = await alchemy.core.getTransactionReceipt(tx.hash);
              if (receipt?.gasUsed && receipt?.effectiveGasPrice) {
                const gwei = Number(BigInt(receipt.gasUsed.toString()) * BigInt(receipt.effectiveGasPrice.toString()) / 10n ** 9n);
                fees[`${net}:${tx.hash}`] = gwei / 1e9;
              }
            } catch { /* skip */ }
          }));
          if (!mounted) return;
          setGasFees(prev => ({ ...prev, ...fees }));
          update_gas_fees(fees);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [address]);


  const perNetworkRunningBalances = useMemo(() => {
    return computeRunningBalances(transfers, tokenBalances, gasFees);
  }, [transfers, tokenBalances, gasFees]);

  const aggregateRunningBalances = useMemo(() => {
    return computeAggregateRunningBalances(transfers, tokenBalances, gasFees);
  }, [transfers, tokenBalances, gasFees]);

  const [filterToken, setFilterToken] = useState('all');
  const [filterNetwork, setFilterNetwork] = useState('all');
  const [showRunningBalance, setShowRunningBalance] = useState(false);

  // Unique tokens and networks for filter dropdowns
  const { uniqueTokens, uniqueNetworks } = useMemo(() => {
    const tokens = new Set();
    const networks = new Set();
    for (const t of transfers) {
      if (t.asset) tokens.add(t.asset.toUpperCase());
      if (t.direction === 'swapped') {
        if (t.fromAsset) tokens.add(t.fromAsset.toUpperCase());
        if (t.toAsset) tokens.add(t.toAsset.toUpperCase());
      }
      networks.add(t.network || 'ethereum');
    }
    return { uniqueTokens: [...tokens].sort(), uniqueNetworks: [...networks].sort() };
  }, [transfers]);

  // Apply token/network filters first, then split by direction
  const baseFiltered = useMemo(() => {
    let list = transfers;
    if (filterToken !== 'all') {
      list = list.filter(t => {
        const sym = filterToken;
        return t.asset?.toUpperCase() === sym || t.fromAsset?.toUpperCase() === sym || t.toAsset?.toUpperCase() === sym;
      });
    }
    if (filterNetwork !== 'all') {
      list = list.filter(t => (t.network || 'ethereum') === filterNetwork);
    }
    return list;
  }, [transfers, filterToken, filterNetwork]);

  const sent = baseFiltered.filter(t => t.direction === 'sent');
  const received = baseFiltered.filter(t => t.direction === 'received');
  const swapped = baseFiltered.filter(t => t.direction === 'swapped');
  const filtered = tab === 'all' ? baseFiltered : tab === 'sent' ? sent : tab === 'received' ? received : swapped;

  // Use aggregate balances when viewing all networks, per-network when filtered
  const runningBalances = filterNetwork === 'all' ? aggregateRunningBalances : perNetworkRunningBalances;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tabs + filters */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-content/5 shrink-0 gap-2">
        <div className="flex items-center gap-1.5">
          {['all', 'sent', 'received', 'swapped'].map((t) => {
            const count = t === 'all' ? baseFiltered.length : t === 'sent' ? sent.length : t === 'received' ? received.length : swapped.length;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`btn btn-xs rounded-full capitalize ${tab === t ? 'btn-primary' : 'btn-ghost text-base-content/40'}`}>
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRunningBalance(p => !p)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors cursor-pointer ${showRunningBalance ? 'border-primary/30 bg-primary/10 text-primary font-medium' : 'border-base-content/10 text-base-content/35 hover:text-base-content/60 hover:border-base-content/20'}`}
          >
            {showRunningBalance ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.092 1.092a4 4 0 0 0-5.558-5.558Z" clipRule="evenodd" />
                <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 4.592 5.53L6.06 7a4 4 0 0 0 4.688 6.93Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
              </svg>
            )}
            Balances
          </button>
          {uniqueTokens.length > 1 && (
            <select
              value={filterToken}
              onChange={e => setFilterToken(e.target.value)}
              className="select select-xs w-auto bg-base-300/50 border-base-content/10 rounded-full text-xs text-base-content/60 focus:outline-none"
            >
              <option value="all">All tokens</option>
              {uniqueTokens.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {uniqueNetworks.length > 1 && (
            <select
              value={filterNetwork}
              onChange={e => setFilterNetwork(e.target.value)}
              className="select select-xs w-auto bg-base-300/50 border-base-content/10 rounded-full text-xs text-base-content/60 focus:outline-none"
            >
              <option value="all">All networks</option>
              {uniqueNetworks.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <TxSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-base-content/15 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <p className="text-sm text-base-content/30">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-base-content/5">
            {filtered.map((tx) => {
              const isSent = tx.direction === 'sent';
              const isSwap = tx.direction === 'swapped';
              const isSubmitted = tx.status === 'submitted';

              const counterpartyAddr = isSent ? tx.to : tx.from;
              const contactProfile = counterpartyAddr ? contactProfiles[counterpartyAddr.toLowerCase()] : null;
              const counterpartyName = contactProfile?.name;
              const counterpartyUser = contactProfile?.username || (isSent ? tx.toUser : tx.fromUser);
              const counterpartyPhoto = contactProfile?.avatar;

              const dirColor = isSubmitted ? 'bg-warning/10' : isSwap ? 'bg-info/10' : isSent ? 'bg-error/10' : 'bg-success/10';
              const iconColor = isSubmitted ? 'text-warning' : isSwap ? 'text-info' : isSent ? 'text-error' : 'text-success';
              const label = isSwap ? 'Swapped' : isSent ? 'Sent' : 'Received';
              const sign = isSent ? '-' : '+';

              // Gas (USD only)
              const gas = gasFees[`${tx.network || 'ethereum'}:${tx.hash}`];
              const gasToken = (tx.network || 'ethereum') === 'polygon' ? 'matic-network' : 'eth';
              const gasPrice = priceMap[gasToken]?.usd || 0;
              const gasUsd = gas && gasPrice ? gas * gasPrice : null;

              // USD values
              const tokenPrice = priceMap[tx.asset?.toLowerCase()]?.usd;
              const usdValue = tx.value != null && tokenPrice ? tx.value * tokenPrice : null;

              // Swap USD values (both sides)
              const fromPrice = priceMap[tx.fromAsset?.toLowerCase()]?.usd;
              const toPrice = priceMap[tx.toAsset?.toLowerCase()]?.usd;
              const fromUsd = tx.fromValue != null && fromPrice ? tx.fromValue * fromPrice : null;
              const toUsd = tx.toValue != null && toPrice ? tx.toValue * toPrice : null;

              // Total USD impact = token value + gas (for sent)
              const totalUsd = isSent && usdValue != null
                ? usdValue + (gasUsd || 0)
                : usdValue;

              // Running balance (token amount) — keyed by network:hash
              const rb = runningBalances[`${tx.network || 'ethereum'}:${tx.hash || tx.uniqueId}`];

              const isSubCent = isSent && totalUsd != null && totalUsd < 0.01;

              return (
                <div key={tx.uniqueId || tx.hash} onClick={() => setSelectedTx(tx)} className={`flex items-center gap-3 px-4 py-3.5 hover:bg-base-content/[0.02] transition-colors cursor-pointer ${isSubCent ? 'opacity-60' : ''}`}>
                  {/* Date */}
                  <p className="text-[10px] tracking-wider text-base-content/25 uppercase w-10 shrink-0">
                    {timeAgo(Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000))}
                  </p>

                  {/* Direction + note */}
                  <div className="flex items-center gap-1.5 w-50 shrink-0 min-h-[40px]">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${dirColor}`}>
                      {isSwap ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 ${iconColor}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                      ) : isSent ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 ${iconColor}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 ${iconColor}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25M4.5 19.5V8.25" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-sm font-medium leading-tight">{label}</span>
                      {tx.title && (
                        <span className="text-xs text-base-content/40 italic">
                          &ldquo;{tx.title.length > 20 ? tx.title.slice(0, 20) + '\u2026' : tx.title}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount — dollar-first, token secondary */}
                  {isSwap ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* From side */}
                      <TokenIcon symbol={tx.fromAsset} tokenLogos={tokenLogos} priceMap={priceMap} network={tx.network || 'ethereum'} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-base-content">
                          {fromUsd != null ? <>-{'\u2009'}{fmtUsd(fromUsd + (gasUsd || 0))}</> : <>-{'\u2009'}{fmtAmount6(tx.fromValue)} {tx.fromAsset}</>}
                        </p>
                        <p className="text-xs text-base-content/40">
                          {fmtAmount6(tx.fromValue)} {tx.fromAsset}
                          {gasUsd != null && <span className="text-base-content/30"> (gas {fmtUsd(gasUsd)})</span>}
                        </p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-base-content/30 shrink-0 self-center">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      {/* To side */}
                      <TokenIcon symbol={tx.toAsset} tokenLogos={tokenLogos} priceMap={priceMap} network={tx.network || 'ethereum'} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-base-content">
                          {toUsd != null ? <>+{'\u2009'}{fmtUsd(toUsd)}</> : <>+{'\u2009'}{fmtAmount6(tx.toValue)} {tx.toAsset}</>}
                        </p>
                        <p className="text-xs text-base-content/40">
                          {fmtAmount6(tx.toValue)} {tx.toAsset}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <TokenIcon symbol={tx.asset} tokenLogos={tokenLogos} priceMap={priceMap} network={tx.network || 'ethereum'} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-base-content">
                          {totalUsd != null
                            ? <>{isSent ? '-\u2009' : '+\u2009'}{isSubCent ? '<$0.01' : fmtUsd(totalUsd)}</>
                            : <>{sign}{'\u2009'}{fmtAmount6(tx.value)} {tx.asset || '???'}</>
                          }
                        </p>
                        <p className="text-xs text-base-content/40">
                          {fmtAmount6(tx.value)} {tx.asset || '???'}
                          {gasUsd != null && isSent && (
                            <span className="text-base-content/30"> (gas {fmtUsd(gasUsd)})</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Network + Counterparty (stacked right column) */}
                  {!showRunningBalance ? (
                    <div className="w-28 shrink-0 text-right space-y-1.5">
                      <p className="text-xs text-base-content/50 uppercase tracking-wide truncate">
                        {tx.network || 'ethereum'}
                      </p>
                      {isSwap ? (
                        <p className="text-xs text-base-content/30 font-mono truncate">{truncateAddr(tx.hash)}</p>
                      ) : counterpartyUser ? (
                        <div className="flex items-center gap-2 justify-end">
                          {counterpartyPhoto ? (
                            <img src={counterpartyPhoto} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : counterpartyAddr ? (
                            <img src={blockies(counterpartyAddr)} alt="" className="w-6 h-6 rounded-full shrink-0" />
                          ) : null}
                          <div className="min-w-0">
                            {counterpartyName && <p className="text-xs font-medium truncate">{counterpartyName}</p>}
                            <p className={`text-[11px] truncate ${counterpartyName ? 'text-base-content/40' : 'text-xs font-medium'}`}>@{counterpartyUser}</p>
                          </div>
                        </div>
                      ) : counterpartyAddr ? (
                        <div className="flex items-center gap-2 justify-end">
                          <img src={blockies(counterpartyAddr)} alt="" className="w-6 h-6 rounded-full shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-base-content/30 truncate">External</p>
                            <p className="text-[11px] text-base-content/40 font-mono truncate">{truncateAddr(counterpartyAddr)}</p>
                          </div>
                        </div>
                      ) : null}
                      {tx.status !== 'confirmed' && (
                        <span className={`badge badge-xs ${STATUS_STYLES[tx.status] || 'badge-ghost'} mt-0.5`}>
                          {tx.status}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-28 shrink-0 text-right">
                      {rb ? (
                        isSwap ? (
                          <div className="space-y-0.5">
                            {rb.from && (
                              <p className="text-sm tabular-nums flex items-center justify-end gap-1 text-error/60">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                                  <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                                </svg>
                                {fmtAmount(rb.from.balance, rb.from.symbol === 'ETH' ? 5 : 2)} <span className="text-error/30">{rb.from.symbol}</span>
                              </p>
                            )}
                            {rb.to && (
                              <p className="text-sm tabular-nums flex items-center justify-end gap-1 text-success/60">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                                  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                                </svg>
                                {fmtAmount(rb.to.balance, rb.to.symbol === 'ETH' ? 5 : 2)} <span className="text-success/30">{rb.to.symbol}</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className={`text-sm tabular-nums flex items-center justify-end gap-1 ${isSent ? 'text-error/60' : 'text-success/60'}`}>
                            {isSent ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                                <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                                <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                              </svg>
                            )}
                            {fmtAmount(rb.balance, rb.symbol === 'ETH' ? 5 : 2)} <span className={isSent ? 'text-error/30' : 'text-success/30'}>{rb.symbol}</span>
                          </p>
                        )
                      ) : (
                        <p className="text-sm text-base-content/20">—</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedTx && (
        <TxDetailModal
          tx={selectedTx}
          gasFees={gasFees}
          tokenLogos={tokenLogos}
          priceMap={priceMap}
          contactProfiles={contactProfiles}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
