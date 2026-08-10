import { fromBaseUnits, displayAmount, toUsd, toUsdForBalance, STABLECOINS, BALANCE_PRESETS } from '../../../utils/tokenUtils';

export default function BalanceInfo({ balance, token, prices, exceeds, showPresets, onPresetClick, onClear }) {
  if (balance === null) return null;

  const balanceUsd = toUsd(fromBaseUnits(balance, token), token, prices);

  return (
    <>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-[11px] ${exceeds ? 'text-error' : 'text-base-content/30'}`}>
          {exceeds ? 'Insufficient balance' : (() => {
            const usd = toUsdForBalance(fromBaseUnits(balance, token), token, prices);
            if (STABLECOINS.has(token)) {
              return <>Balance: {usd} <span className="text-base-content/20">· {displayAmount(balance, token)} {token}</span></>;
            }
            if (usd) {
              return <>Balance: {usd} <span className="text-base-content/20">· {displayAmount(balance, token)} {token}</span></>;
            }
            return <>Balance: {displayAmount(balance, token)} {token}</>;
          })()}
        </span>
      </div>
      {showPresets && BigInt(balance) > 0n && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {BALANCE_PRESETS.map(pct => {
            const val = (BigInt(balance) * BigInt(pct) / 100n).toString();
            const usd = toUsd(fromBaseUnits(val, token), token, prices);
            return (
              <button key={pct} type="button" className="text-[10px] text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors"
                onMouseDown={(e) => { e.preventDefault(); onPresetClick(val); }}>
                {pct}%{usd && <span className="text-primary/40 ml-0.5">{usd}</span>}
              </button>
            );
          })}
          <button type="button" className="text-[10px] text-primary font-semibold bg-primary/10 border border-primary/20 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors"
            onMouseDown={(e) => { e.preventDefault(); onPresetClick(balance); }}>
            Max
          </button>
          {onClear && (
            <button type="button" className="text-[10px] text-red-400 bg-red-900/20 border border-red-800/30 hover:bg-red-900/30 ml-auto px-2 py-0.5 rounded-full transition-colors"
              onMouseDown={(e) => { e.preventDefault(); onClear(); }}>
              Clear
            </button>
          )}
        </div>
      )}
    </>
  );
}
