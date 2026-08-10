import { useState, useEffect, useRef, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { LABEL } from './tradeStyles';
import { GAS_LIMITS, NETWORK_CHAIN_IDS, fetchFeeData, buildGasParams } from '../../../utils/gasUtils';

const POLL_INTERVAL = 15_000;

const TIERS = [
  { key: 'slow',   label: 'Low',    time: '24 - 48 sec', rewardIdx: 0 },
  { key: 'normal', label: 'Market', time: '12 - 24 sec', rewardIdx: 1 },
  { key: 'fast',   label: 'Fast',   time: '< 12 sec',    rewardIdx: 2 },
];

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

export default function GasSpeedSelector({ selected, onSelect, isNative, ethPrice, network = 'ethereum' }) {
  const chainId = NETWORK_CHAIN_IDS[network] ?? 1;
  const client = usePublicClient({ chainId });
  const [feeData, setFeeData] = useState(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const fetchFees = useCallback(() => fetchFeeData(client), [client]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    const poll = async () => {
      const data = await fetchFees();
      if (cancelled || !data) return;
      setFeeData(data);

      const tier = TIERS.find(t => t.key === selectedRef.current);
      if (tier) {
        onSelect(selectedRef.current, buildGasParams(data, tier.rewardIdx));
      }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, [client, fetchFees, onSelect]);

  if (!feeData) return null;

  const gasLimit = isNative ? GAS_LIMITS.native : GAS_LIMITS.erc20;

  return (
    <div>
      <span className={`${LABEL} mb-2 block`}>Gas speed</span>
      <div className="grid grid-cols-3 gap-2">
        {TIERS.map(({ key, label, time, rewardIdx }) => {
          const params = buildGasParams(feeData, rewardIdx);
          const cost = gasLimit * params.maxFeePerGas;
          const active = selected === key;

          return (
            <button
              key={key} type="button"
              onClick={() => onSelect(key, params)}
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
    </div>
  );
}
