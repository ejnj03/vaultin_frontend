import { useState, useEffect, useRef, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { formatGwei } from 'viem';
import { CARD, LABEL } from './tradeStyles';

const GAS_LIMITS = { native: 21_000n, erc20: 65_000n };
const POLL_INTERVAL = 15_000;

const TIERS = [
  { key: 'slow',   label: 'Low',    time: '24 - 48 sec', rewardIdx: 0 },
  { key: 'normal', label: 'Market', time: '12 - 24 sec', rewardIdx: 1 },
  { key: 'fast',   label: 'Fast',   time: '< 12 sec',    rewardIdx: 2 },
];

function median(arr) {
  const sorted = [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return sorted[Math.floor(sorted.length / 2)];
}

function fmtEth(wei) {
  const eth = Number(wei) / 1e18;
  if (eth === 0) return '0';
  if (eth < 0.000001) return '<0.000001';
  return eth.toPrecision(4);
}

function fmtUsd(wei, ethPrice) {
  if (!ethPrice) return null;
  const usd = (Number(wei) / 1e18) * ethPrice;
  if (usd < 0.01) return '<$0.01';
  return `$${usd.toFixed(2)}`;
}

function parseFeeHistory(history) {
  const baseFee = history.baseFeePerGas[history.baseFeePerGas.length - 1];
  const priorities = [0, 1, 2].map(idx =>
    median(history.reward.map(r => r[idx]))
  );
  return { baseFee, priorities };
}

export default function GasSpeedSelector({ selected, onSelect, isNative, ethPrice }) {
  const client = usePublicClient({ chainId: 1 });
  const [feeData, setFeeData] = useState(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const fetchFees = useCallback(async () => {
    if (!client) return null;
    try {
      const history = await client.getFeeHistory({
        blockCount: 5,
        rewardPercentiles: [10, 50, 90],
      });
      return parseFeeHistory(history);
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    const poll = async () => {
      const data = await fetchFees();
      if (cancelled || !data) return;
      setFeeData(data);

      // Update the parent with fresh params for the currently selected tier
      const tier = TIERS.find(t => t.key === selectedRef.current);
      if (tier) {
        const priority = data.priorities[tier.rewardIdx];
        const maxFee = data.baseFee + priority;
        onSelect(selectedRef.current, { maxFeePerGas: maxFee, maxPriorityFeePerGas: priority });
      }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, [client, fetchFees, onSelect]);

  if (!feeData) return null;

  const { baseFee, priorities } = feeData;
  const gasLimit = isNative ? GAS_LIMITS.native : GAS_LIMITS.erc20;

  return (
    <div className={CARD}>
      <span className={`${LABEL} mb-2 block`}>Gas speed</span>
      <div className="grid grid-cols-3 gap-2">
        {TIERS.map(({ key, label, time, rewardIdx }) => {
          const priority = priorities[rewardIdx];
          const maxFee = baseFee + priority;
          const cost = gasLimit * maxFee;
          const active = selected === key;

          return (
            <button
              key={key} type="button"
              onClick={() => onSelect(key, { maxFeePerGas: maxFee, maxPriorityFeePerGas: priority })}
              className={`rounded-xl p-2.5 text-center transition-colors cursor-pointer border ${
                active
                  ? 'border-primary bg-primary/10'
                  : 'border-base-content/10 bg-base-content/[0.03] hover:bg-base-content/[0.06]'
              }`}
            >
              <p className={`text-xs font-semibold ${active ? 'text-primary' : 'text-base-content/70'}`}>{label}</p>
              <p className="text-[10px] text-base-content/40 mt-0.5">{time}</p>
              <p className={`text-[10px] mt-1 ${active ? 'text-primary/60' : 'text-base-content/30'}`}>
                {fmtEth(cost)} ETH
              </p>
              <p className="text-[10px] text-base-content/20">{fmtUsd(cost, ethPrice)}</p>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-base-content/20 mt-2">
        Base: {formatGwei(baseFee)} Gwei · Priority: {formatGwei(priorities[1])} Gwei
      </p>
    </div>
  );
}
