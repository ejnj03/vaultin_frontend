import { useState, useEffect } from 'react';
import { Utils } from 'alchemy-sdk';
import { NETWORK_LOGOS, TOKEN_LOGOS } from '../../utils/networkLogos';
import { STABLECOINS } from '../../utils/tokenUtils';
import { timeAgo } from '../../utils/formatting';

function formatBalance(raw, decimals) {
  const formatted = Utils.formatUnits(raw, decimals);
  const num = parseFloat(formatted);
  if (num === 0) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'M';
  if (num >= 1_000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (num >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return num.toLocaleString(undefined, { maximumSignificantDigits: 4 });
}

function formatValue(value) {
  if (value == null) return '—';
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value > 0) return `$${value.toFixed(4)}`;
  return '$0.00';
}

function formatAggBalance(num) {
  if (num === 0) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'M';
  if (num >= 1_000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (num >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return num.toLocaleString(undefined, { maximumSignificantDigits: 4 });
}

function formatPrice(value) {
  if (value == null) return '—';
  if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(6)}`;
}

export function TokenCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-base-content/5 px-4 py-3.5 flex items-center gap-3.5">
      <div className="w-10 h-10 bg-base-content/10 rounded-full shrink-0"></div>
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex justify-between">
          <div className="h-4 bg-base-content/10 rounded w-24"></div>
          <div className="h-4 bg-base-content/10 rounded w-16"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-base-content/5 rounded w-20"></div>
          <div className="h-3 bg-base-content/5 rounded w-28"></div>
        </div>
      </div>
    </div>
  );
}

export function TokenCard({ token, priceData, aggregated }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const humanBalance = aggregated ? token._humanBalance : parseFloat(Utils.formatUnits(token.balance, token.decimals));
  const display = aggregated ? formatAggBalance(humanBalance) : formatBalance(token.balance, token.decimals);
  const value = priceData?.usd ? humanBalance * priceData.usd : null;
  const pctChange = priceData?.usd_24h_change;
  const up = pctChange != null && pctChange >= 0;
  const updatedLabel = priceData?.last_updated_at ? `Updated ${timeAgo(priceData.last_updated_at)}` : undefined;
  const isStable = STABLECOINS.has(token.symbol?.toUpperCase());

  return (
    <div className="rounded-lg border border-base-content/5 px-4 py-3.5 flex items-center gap-3.5 hover:border-base-content/10 hover:bg-base-content/[0.02] transition-colors">
      {/* Token Logo + Network dot */}
      <div className="relative shrink-0">
        {token.logo || priceData?.image || TOKEN_LOGOS[token.symbol?.toUpperCase()] ? (
          <img src={token.logo || priceData?.image || TOKEN_LOGOS[token.symbol?.toUpperCase()]} className="w-10 h-10 rounded-full" alt={token.symbol} />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: (token.network?.color || '#627EEA') + '18', color: token.network?.color || '#627EEA' }}
          >
            {token.symbol?.[0] || '?'}
          </div>
        )}
        {aggregated && token._networks?.length > 1 ? (
          <div className="absolute -bottom-0.5 -right-0.5 flex -space-x-1">
            {token._networks.slice(0, 3).map((net, i) => (
              NETWORK_LOGOS[net?.id] ? (
                <img key={net?.id || i} src={NETWORK_LOGOS[net.id]} className="w-3 h-3 rounded-full border border-base-200" alt={net?.name} title={net?.name} />
              ) : (
                <span key={net?.id || i} className="w-3 h-3 rounded-full border border-base-200" style={{ backgroundColor: net?.color || '#627EEA' }} title={net?.name}></span>
              )
            ))}
          </div>
        ) : NETWORK_LOGOS[token.network?.id] ? (
          <img
            src={NETWORK_LOGOS[token.network.id]}
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border border-base-200"
            alt={token.network?.name}
            title={token.network?.name}
          />
        ) : (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border border-base-200"
            style={{ backgroundColor: token.network?.color || '#627EEA' }}
            title={token.network?.name}
          ></span>
        )}
      </div>

      {/* Content rows */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Row 1: Token name · Chain ↔ Holdings value */}
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold text-base-content text-sm truncate">
            {token.name}
            {aggregated && token._networks?.length > 1 ? (
              <span className="text-base-content/25 font-normal ml-1">&middot; {token._networks.length} networks</span>
            ) : token.network?.name ? (
              <span className="text-base-content/25 font-normal ml-1">&middot; {token.network.shortName || token.network.name}</span>
            ) : null}
          </p>
          <p className="font-bold text-base-content text-sm tabular-nums shrink-0">
            {value != null ? formatValue(value) : '—'}
          </p>
        </div>

        {/* Row 2: Balance in tokens ↔ Market price · 24h change (hidden for stables) */}
        <div className="flex items-baseline justify-between">
          <p className="text-xs text-base-content/40 tabular-nums truncate">
            {display} {token.symbol}
          </p>
          {isStable ? (
            <p className="text-xs text-base-content/20 shrink-0">Stablecoin</p>
          ) : (
            <p className="text-xs text-base-content/35 tabular-nums shrink-0" title={updatedLabel}>
              {priceData && formatPrice(priceData.usd)}
              {pctChange != null && (
                <>
                  <span className="text-base-content/15 mx-1">&middot;</span>
                  <span className={`font-medium ${up ? 'text-success' : 'text-error'}`}>
                    {up ? '+' : ''}{pctChange.toFixed(1)}%
                  </span>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TokenCard;
