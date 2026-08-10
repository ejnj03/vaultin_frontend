// UI display decimals (what the user sees/types)
export const TOKEN_DECIMALS = { ETH: 9, cbBTC: 8, USDC: 2, USDT: 2, EURC: 2, POL: 9 };
// On-chain decimals (full precision for transactions)
export const CHAIN_DECIMALS = { ETH: 18, cbBTC: 8, USDC: 6, USDT: 6, EURC: 6, POL: 18 };
export const STABLECOINS = new Set(['USDC', 'USDT', 'EURC']);
export const BALANCE_PRESETS = [10, 25, 50]; // integer percentages
export const DOLLAR_PRESETS = [1, 5, 10, 25];
export const FEE_TIERS = { '0.01%': 100, '0.05%': 500, '0.3%': 3000, '1%': 10000 };

// UI display decimals for AmountInput
export function decimalsFor(token) {
  return TOKEN_DECIMALS[token] ?? 6;
}

// Readable string → base unit string (BigInt-safe)
// e.g. "1.5" ETH → "1500000000000000000"
export function toBaseUnits(readable, token) {
  if (!readable || readable === '' || readable === '.') return '0';
  const decimals = CHAIN_DECIMALS[token] ?? 18;
  const [whole = '0', frac = ''] = readable.split('.');
  const paddedFrac = frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFrac).toString();
}

// Base unit string → readable string (full chain precision, trailing zeros trimmed)
// e.g. "1500000000000000000" ETH → "1.5"
export function fromBaseUnits(baseStr, token) {
  if (!baseStr) return '0';
  const decimals = CHAIN_DECIMALS[token] ?? 18;
  const s = baseStr.toString();
  if (s === '0') return '0';
  const padded = s.padStart(decimals + 1, '0');
  const whole = padded.slice(0, padded.length - decimals);
  const frac = padded.slice(padded.length - decimals);
  const trimmed = frac.replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole;
}

// Readable string padded to UI decimal places (for input fields / presets)
export function padDisplay(readable, token) {
  const d = TOKEN_DECIMALS[token] ?? 6;
  const [whole, frac = ''] = readable.split('.');
  return `${whole}.${frac.padEnd(d, '0').slice(0, d)}`;
}

// Truncate to N significant digits (leading zeros in frac don't count)
const MAX_SIG_DIGITS = 6;
function truncateToSigDigits(whole, frac) {
  if (!frac) return whole;
  if (whole === '0') {
    const leadingZeros = frac.match(/^0*/)[0].length;
    const significant = frac.slice(leadingZeros);
    const kept = significant.slice(0, MAX_SIG_DIGITS);
    const result = frac.slice(0, leadingZeros) + kept;
    const trimmed = result.replace(/0+$/, '');
    return trimmed ? `0.${trimmed}` : '0';
  }
  const fracAllowed = Math.max(MAX_SIG_DIGITS - whole.length, 2);
  const trimmed = frac.slice(0, fracAllowed).replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole;
}

// Base unit string → display string (truncated to UI decimals + sig digits)
export function displayAmount(baseStr, token) {
  const full = fromBaseUnits(baseStr, token);
  const [whole, frac = ''] = full.split('.');
  if (!frac) return STABLECOINS.has(token) ? `${whole}.00` : whole;
  if (STABLECOINS.has(token)) {
    const display = `${whole}.${frac.padEnd(2, '0').slice(0, 2)}`;
    if (display === '0.00' && frac.replace(/0+$/, '')) return '<0.01';
    return display;
  }
  const d = TOKEN_DECIMALS[token] ?? 6;
  const uiTruncated = frac.slice(0, d);
  return truncateToSigDigits(whole, uiTruncated);
}

// USD conversion — takes readable amount string, returns formatted USD string
// USD is excluded from BigInt treatment (uses floats)
export function toUsd(amount, token, prices) {
  if (!amount || !token || !prices || STABLECOINS.has(token)) return null;
  const price = prices[token.toLowerCase()]?.usd;
  if (!price) return null;
  const usd = parseFloat(amount) * price;
  if (usd < 0.01) return '<$0.01';
  return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// USD conversion — takes readable amount string, returns raw numeric USD value
export function toUsdRaw(amount, token, prices) {
  if (amount == null || amount === '' || !token || !prices) return null;
  if (STABLECOINS.has(token)) return parseFloat(amount);
  const price = prices[token.toLowerCase()]?.usd;
  if (!price) return null;
  return parseFloat(amount) * price;
}

// USD conversion that works for stablecoins too (for balance display)
export function toUsdForBalance(amount, token, prices) {
  if (!amount || !token) return null;
  if (STABLECOINS.has(token)) {
    const usd = parseFloat(amount);
    if (isNaN(usd) || usd === 0) return null;
    if (usd < 0.01) return '<$0.01';
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return toUsd(amount, token, prices);
}

// USD → readable token string (uses float for USD math, returns full-precision string)
export function fromUsd(usdAmount, token, prices) {
  if (!token || !prices) return null;
  const decimals = CHAIN_DECIMALS[token] ?? 18;
  if (STABLECOINS.has(token)) return usdAmount.toFixed(decimals);
  const price = prices[token.toLowerCase()]?.usd;
  if (!price) return null;
  return (usdAmount / price).toFixed(decimals);
}
