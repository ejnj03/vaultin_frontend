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

export function TokenCardSkeleton() {
  return (
    <tr className="animate-pulse border-b border-base-content/5">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-base-content/10 rounded-full shrink-0"></div>
          <div>
            <div className="h-4 bg-base-content/10 rounded w-24 mb-1.5"></div>
            <div className="h-3 bg-base-content/5 rounded w-14"></div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 hidden sm:table-cell">
        <div className="h-5 bg-base-content/5 rounded-full w-12"></div>
      </td>
      <td className="py-4 px-6 text-right">
        <div className="h-4 bg-base-content/10 rounded w-32 ml-auto"></div>
      </td>
    </tr>
  );
}

export function TokenCard({ token }) {
  const display = formatBalance(token.balance, token.decimals);

  return (
    <tr className="border-b border-base-content/5 last:border-b-0 hover:bg-base-content/[0.03] transition-colors">
      <td className="py-3.5 px-6">
        <div className="flex items-center gap-3">
          {token.logo ? (
            <img src={token.logo} className="w-9 h-9 rounded-full shrink-0" alt={token.symbol} />
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
      <td className="py-3.5 px-6 hidden sm:table-cell">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: (token.network?.color || '#627EEA') + '18', color: token.network?.color || '#627EEA' }}
        >
          {token.network?.shortName || 'ETH'}
        </span>
      </td>
      <td className="py-3.5 px-6 text-right">
        <p className="font-semibold text-base-content tabular-nums whitespace-nowrap">
          {display} <span className="text-base-content/50 font-normal">{token.symbol}</span>
        </p>
        <p className="text-xs text-base-content/40 sm:hidden">{token.network?.name}</p>
      </td>
    </tr>
  );
}

export default TokenCard;
