export const GAS_LIMITS = { native: 21_000n, erc20: 65_000n };

export const NETWORK_CHAIN_IDS = {
  ethereum: 1,
  arbitrum: 42161,
  base: 8453,
  optimism: 10,
  polygon: 137,
};

const REWARD_PERCENTILES = [10, 50, 90];

function median(arr) {
  const sorted = [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return sorted[Math.floor(sorted.length / 2)];
}

export function parseFeeHistory(history) {
  const baseFee = history.baseFeePerGas[history.baseFeePerGas.length - 1];
  const priorities = [0, 1, 2].map(idx =>
    median(history.reward.map(r => r[idx]))
  );
  return { baseFee, priorities };
}

export async function fetchFeeData(client, blockCount = 5) {
  if (!client) return null;
  try {
    const history = await client.getFeeHistory({
      blockCount,
      rewardPercentiles: REWARD_PERCENTILES,
    });
    return parseFeeHistory(history);
  } catch (err) {
    console.error('fetchFeeData:', err);
    return null;
  }
}

// Tier index: 0 = slow (10th pct), 1 = normal (50th pct), 2 = fast (90th pct)
export function buildGasParams(feeData, tierIdx = 1) {
  const priority = feeData.priorities[tierIdx];
  const maxFee = feeData.baseFee + priority;
  return { maxFeePerGas: maxFee, maxPriorityFeePerGas: priority };
}

// Total gas cost in wei from quote metadata (gas units) × gas price
export function estimateGasCostWei(metadata, gasParams) {
  if (!gasParams || !metadata) return 0n;
  const gasUnits = metadata.is_approved
    ? BigInt(metadata.transaction_gas)
    : BigInt(metadata.approval_gas) + BigInt(metadata.transaction_gas);
  return gasUnits * gasParams.maxFeePerGas;
}

// Add EIP-1559 gas params to each contract in the array
export function augmentContracts(contracts, gasParams) {
  if (!gasParams) return contracts;
  return contracts.map(c => ({
    ...c,
    maxFeePerGas: gasParams.maxFeePerGas,
    maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
  }));
}
