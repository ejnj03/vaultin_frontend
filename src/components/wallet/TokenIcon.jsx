import { TOKEN_LOGOS, NETWORK_LOGOS } from '../../utils/networkLogos';

export default function TokenIcon({ symbol, tokenLogos, priceMap, network }) {
  const logo = tokenLogos[symbol?.toUpperCase()] || priceMap[symbol?.toLowerCase()]?.image || TOKEN_LOGOS[symbol?.toUpperCase()];
  const networkLogo = network ? NETWORK_LOGOS[network] : null;

  return (
    <div className="relative shrink-0">
      {logo ? (
        <img src={logo} className="w-6 h-6 rounded-full" alt={symbol} />
      ) : (
        <div className="w-6 h-6 rounded-full bg-base-content/10 flex items-center justify-center text-[10px] font-bold text-base-content/40">
          {symbol?.[0] || '?'}
        </div>
      )}
      {networkLogo && (
        <img
          src={networkLogo}
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-base-200"
          alt={network}
        />
      )}
    </div>
  );
}
