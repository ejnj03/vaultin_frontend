import { displayAmount, fromBaseUnits, toUsd, toUsdRaw } from './tokenUtils';
import { estimateGasCostWei } from './gasUtils';

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

// gasParams: { maxFeePerGas, maxPriorityFeePerGas } from useGasFees or GasSpeedSelector
export function getGasFeeWei(quote, gasParams) {
  return estimateGasCostWei(quote, gasParams);
}

export function getEfficiencyDisplay(quote, fromToken, toToken, prices, gasParams) {
  const totalInput = (BigInt(quote.swapped) + BigInt(quote.swap_fee)).toString();
  const inputUsdRaw = toUsdRaw(fromBaseUnits(totalInput, fromToken), fromToken, prices);
  const outputUsdRaw = toUsdRaw(fromBaseUnits(quote.output, toToken), toToken, prices);
  if (inputUsdRaw == null || outputUsdRaw == null) return null;

  // Include gas in total send cost
  const gasFeeWei = getGasFeeWei(quote, gasParams);
  const ethPrice = prices?.eth?.usd ?? null;
  const gasFeeUsdRaw = gasParams && ethPrice ? (Number(gasFeeWei) / 1e18) * ethPrice : 0;
  const totalSendUsd = inputUsdRaw + gasFeeUsdRaw;
  if (totalSendUsd <= 0) return null;

  const raw = (outputUsdRaw / totalSendUsd) * 100;
  if (raw >= 99.95) return '>99.9%';
  const efficiency = Math.min(raw, 100);
  return `${efficiency.toFixed(1)}%`;
}

export function formatQuoteBreakdown(quote, fromToken, toToken, prices, gasParams) {
  const gasFeeWei = getGasFeeWei(quote, gasParams);
  const ethPrice = prices?.eth?.usd ?? null;

  // Output side
  const outputDisplay = displayAmount(quote.output, toToken);
  const outputUsd = toUsd(fromBaseUnits(quote.output, toToken), toToken, prices);

  // Pool input (what actually gets swapped)
  const swappedDisplay = displayAmount(quote.swapped, fromToken);
  const swappedUsd = toUsd(fromBaseUnits(quote.swapped, fromToken), fromToken, prices);

  // Swap fee (in input token)
  const swapFeeDisplay = displayAmount(quote.swap_fee, fromToken);
  const swapFeeUsd = toUsd(fromBaseUnits(quote.swap_fee, fromToken), fromToken, prices);

  // Total input = swapped + swap_fee (both in input token base units)
  const totalInput = (BigInt(quote.swapped) + BigInt(quote.swap_fee)).toString();
  const inputDisplay = displayAmount(totalInput, fromToken);
  const inputUsd = toUsd(fromBaseUnits(totalInput, fromToken), fromToken, prices);

  // Gas fee (in wei / ETH) — shows "–" if gasParams not yet loaded
  const gasFeeEth = gasParams ? `${fmtEth(gasFeeWei)} ETH` : '–';
  const gasFeeUsd = gasParams ? fmtUsd(gasFeeWei, ethPrice) : null;

  // Combined fee total in USD
  const swapFeeUsdRaw = toUsdRaw(fromBaseUnits(quote.swap_fee, fromToken), fromToken, prices);
  const gasFeeUsdRaw = gasParams && ethPrice ? (Number(gasFeeWei) / 1e18) * ethPrice : null;
  const totalFeeUsd = (swapFeeUsdRaw != null && gasFeeUsdRaw != null)
    ? `$${(swapFeeUsdRaw + gasFeeUsdRaw).toFixed(2)}` : null;

  // Total out of pocket: input USD + gas USD
  const inputUsdRaw = toUsdRaw(fromBaseUnits(totalInput, fromToken), fromToken, prices);
  const totalOutOfPocket = (inputUsdRaw != null && gasFeeUsdRaw != null)
    ? `$${(inputUsdRaw + gasFeeUsdRaw).toFixed(2)}` : inputUsd;

  return {
    inputDisplay, inputUsd,
    outputDisplay, outputUsd,
    swappedDisplay, swappedUsd,
    swapFeeDisplay, swapFeeUsd,
    gasFeeEth, gasFeeUsd,
    needsApproval: !quote.is_approved,
    totalFeeUsd,
    totalOutOfPocket,
  };
}
