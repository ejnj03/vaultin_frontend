import { Utils } from 'alchemy-sdk';

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

function formatPrice(value) {
  if (value == null) return '—';
  if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(6)}`;
}

function PctBadge({ value }) {
  if (value == null) return <span className="text-base-content/30">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium ${up ? 'text-success' : 'text-error'}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-3 h-3 ${up ? '' : 'rotate-180'}`}>
        <path fillRule="evenodd" d="M8 3.293l4.354 4.354-.708.707L8.5 5.207V12.5h-1V5.207L4.354 8.354l-.708-.707L8 3.293z" clipRule="evenodd" />
      </svg>
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export function TokenCardSkeleton() {
  return (
    <tr className="animate-pulse border-b border-base-content/5">
      <td className="py-4 pl-8 pr-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-base-content/10 rounded-full shrink-0"></div>
          <div>
            <div className="h-4 bg-base-content/10 rounded w-24 mb-1.5"></div>
            <div className="h-3 bg-base-content/5 rounded w-14"></div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 hidden lg:table-cell">
        <div className="h-5 bg-base-content/5 rounded-full w-12 mx-auto"></div>
      </td>
      <td className="py-4 px-6">
        <div className="h-4 bg-base-content/10 rounded w-16 mx-auto"></div>
      </td>
      <td className="py-4 px-6 hidden lg:table-cell">
        <div className="h-4 bg-base-content/5 rounded w-14 mx-auto"></div>
      </td>
      <td className="py-4 px-6">
        <div className="h-4 bg-base-content/5 rounded w-14 mx-auto"></div>
      </td>
      <td className="py-4 px-6 hidden lg:table-cell">
        <div className="h-4 bg-base-content/5 rounded w-14 mx-auto"></div>
      </td>
      <td className="py-4 pl-6 pr-8">
        <div className="h-4 bg-base-content/10 rounded w-20 mx-auto mb-1"></div>
        <div className="h-3 bg-base-content/5 rounded w-16 mx-auto"></div>
      </td>
    </tr>
  );
}

export function TokenCard({ token, priceData }) {
  const humanBalance = parseFloat(Utils.formatUnits(token.balance, token.decimals));
  const display = formatBalance(token.balance, token.decimals);
  const value = priceData ? humanBalance * priceData.current_price : null;

  return (
    <tr className="border-b border-base-content/5 last:border-b-0 hover:bg-base-content/[0.03] transition-colors">
      <td className="py-3.5 pl-8 pr-6">
        <div className="flex items-center gap-3">
          {token.logo || priceData?.image ? (
            <img src={token.logo || priceData?.image} className="w-9 h-9 rounded-full shrink-0" alt={token.symbol} />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
              style={{ backgroundColor: (token.network?.color || '#627EEA') + '18', color: token.network?.color || '#627EEA' }}
            >
              {token.symbol?.[0] || '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-base-content truncate">{token.name}</p>
            <p className="text-xs text-base-content/40">{token.symbol}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-6 text-center hidden lg:table-cell">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: (token.network?.color || '#627EEA') + '18', color: token.network?.color || '#627EEA' }}
        >
          {token.network?.shortName || 'ETH'}
        </span>
      </td>
      <td className="py-3.5 px-6 text-center font-mono text-sm font-medium whitespace-nowrap">
        {priceData ? formatPrice(priceData.current_price) : <span className="text-base-content/30">—</span>}
      </td>
      <td className="py-3.5 px-6 text-center text-sm hidden lg:table-cell">
        <PctBadge value={priceData?.price_change_percentage_1h_in_currency} />
      </td>
      <td className="py-3.5 px-6 text-center text-sm">
        <PctBadge value={priceData?.price_change_percentage_24h} />
      </td>
      <td className="py-3.5 px-6 text-center text-sm hidden lg:table-cell">
        <PctBadge value={priceData?.price_change_percentage_7d_in_currency} />
      </td>
      <td className="py-3.5 pl-6 pr-8 text-center">
        <p className="font-semibold text-base-content tabular-nums whitespace-nowrap">
          {value != null ? formatValue(value) : <span className="text-base-content/30">—</span>}
        </p>
        <p className="text-xs text-base-content/40 tabular-nums whitespace-nowrap">
          {display} {token.symbol}
        </p>
        <p className="text-xs text-base-content/40 lg:hidden">{token.network?.name}</p>
      </td>
    </tr>
  );
}

export default TokenCard;
