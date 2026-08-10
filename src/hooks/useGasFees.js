import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { NETWORK_CHAIN_IDS, fetchFeeData, buildGasParams } from '../utils/gasUtils';

const POLL_INTERVAL = 15_000;

export function useGasFees(network) {
  const chainId = NETWORK_CHAIN_IDS[network] ?? null;
  const client = usePublicClient({ chainId: chainId ?? undefined });
  const [gasParams, setGasParams] = useState(null);

  const fetchFees = useCallback(() => fetchFeeData(client), [client]);

  useEffect(() => {
    if (!client || !chainId) { setGasParams(null); return; }
    let cancelled = false;

    const poll = async () => {
      const data = await fetchFees();
      if (cancelled || !data) return;
      setGasParams(buildGasParams(data, 1));
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, [client, chainId, fetchFees]);

  return gasParams;
}
