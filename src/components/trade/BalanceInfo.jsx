import { fromBaseUnits, displayAmount, toUsd, BALANCE_PRESETS } from '../../utils/tokenUtils';

export default function BalanceInfo({ balance, token, prices, exceeds, showPresets, onPresetClick }) {
  if (balance === null) return null;

  const balanceUsd = toUsd(fromBaseUnits(balance, token), token, prices);

  return (
    <>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-[11px] ${exceeds ? 'text-error' : 'text-base-content/30'}`}>
          {exceeds ? 'Insufficient balance' : (
            <>Balance: {displayAmount(balance, token)} {token}{balanceUsd && <span className="text-base-content/20"> · {balanceUsd}</span>}</>
          )}
        </span>
      </div>
      {showPresets && BigInt(balance) > 0n && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {BALANCE_PRESETS.map(pct => {
            const val = (BigInt(balance) * BigInt(pct) / 100n).toString();
            const usd = toUsd(fromBaseUnits(val, token), token, prices);
            return (
              <button key={pct} type="button" className="text-[10px] text-primary/70 hover:text-primary bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-full transition-colors"
                onClick={() => onPresetClick(val)}>
                {pct}%{usd && <span className="text-primary/40 ml-0.5">{usd}</span>}
              </button>
            );
          })}
          <button type="button" className="text-[10px] text-primary font-semibold bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-full transition-colors"
            onClick={() => onPresetClick(balance)}>
            Max
          </button>
        </div>
      )}
    </>
  );
}
