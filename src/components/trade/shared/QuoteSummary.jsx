import { useState, useMemo } from 'react';
import { formatQuoteBreakdown, getEfficiencyDisplay } from '../../../utils/quoteUtils';
import { fromBaseUnits } from '../../../utils/tokenUtils';
import { CARD } from './tradeStyles';

function Row({ label, value, sub, border, bold, highlight }) {
  const promoted = bold || highlight;
  return (
    <div className={`flex items-center justify-between py-1.5 ${border ? 'border-b border-base-content/5' : ''}`}>
      <span className={promoted ? 'text-sm font-semibold text-base-content' : 'text-[11px] text-base-content/40'}>{label}</span>
      <div className="text-right tabular-nums">
        <span className={promoted ? 'text-sm font-semibold text-base-content' : 'text-[11px] font-medium text-base-content/60'}>{value}</span>
        {sub && <span className="text-[10px] text-base-content/25 ml-1.5">{sub}</span>}
      </div>
    </div>
  );
}

export default function QuoteSummary({ quote, fromToken, toToken, prices, gasParams, recipient }) {
  const [open, setOpen] = useState(false);

  const b = useMemo(
    () => formatQuoteBreakdown(quote, fromToken, toToken, prices, gasParams),
    [quote, fromToken, toToken, prices, gasParams],
  );

  const efficiency = useMemo(
    () => getEfficiencyDisplay(quote, fromToken, toToken, prices, gasParams),
    [quote, fromToken, toToken, prices, gasParams],
  );

  const rate = useMemo(() => {
    const inReadable = parseFloat(fromBaseUnits(quote.swapped, fromToken));
    const outReadable = parseFloat(fromBaseUnits(quote.output, toToken));
    if (!inReadable || !outReadable) return null;
    const r = outReadable / inReadable;
    return `1 ${fromToken} = ${r >= 1 ? r.toFixed(6) : r.toPrecision(6)} ${toToken}`;
  }, [quote, fromToken, toToken]);

  return (
    <div className={CARD}>
      <button
        type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {!open && b.totalOutOfPocket && (
            <span className="text-[12px] text-base-content/70 font-semibold tabular-nums">
              Total {b.totalOutOfPocket}
              {b.totalFeeUsd && <span className="text-base-content/30 font-normal ml-1">(Fees: {b.totalFeeUsd})</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!open && efficiency && (
            <span className="text-[10px] font-semibold text-primary bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">
              {efficiency} value delivered
            </span>
          )}
          <svg
            className={`w-3.5 h-3.5 text-base-content/30 group-hover:text-base-content/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr] mt-2' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          {rate && (
            <p className="text-[11px] text-base-content/35 font-medium tabular-nums pb-1.5 border-b border-base-content/5">{rate}</p>
          )}

          <Row label="You pay" value={`${b.inputDisplay} ${fromToken}`} sub={b.inputUsd} border />
          <Row label={recipient ? `${recipient} receives` : 'You receive'} value={`${b.outputDisplay} ${toToken}`} sub={b.outputUsd} border />

          {efficiency && (
            <div className="flex justify-center py-1.5 border-b border-base-content/5">
              <span className="text-[10px] font-semibold text-primary bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary/30">
                {efficiency} value delivered
              </span>
            </div>
          )}

          <p className="text-[10px] text-base-content/20 font-medium uppercase tracking-wider pt-2 pb-1">Fees</p>
          <Row label="Amount swapped" value={`${b.swappedDisplay} ${fromToken}`} sub={b.swappedUsd} border />
          <Row label="Swap fee" value={`${b.swapFeeDisplay} ${fromToken}`} sub={b.swapFeeUsd} border />

          <div className={`flex items-center justify-between py-1.5 border-b border-base-content/5`}>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-base-content/40">Gas fee</span>
              {b.needsApproval && (
                <span className="text-[9px] font-semibold text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20">Approval needed</span>
              )}
            </div>
            <div className="text-right tabular-nums">
              <span className="text-[11px] font-medium text-base-content/60">{b.gasFeeEth}</span>
              {b.gasFeeUsd && <span className="text-[10px] text-base-content/25 ml-1.5">{b.gasFeeUsd}</span>}
            </div>
          </div>

          {b.totalFeeUsd && (
            <Row label="Total fees" value={b.totalFeeUsd} border bold />
          )}

          {b.totalOutOfPocket && (
            <Row label="Total out of pocket" value={b.totalOutOfPocket} bold highlight />
          )}
        </div>
      </div>
    </div>
  );
}