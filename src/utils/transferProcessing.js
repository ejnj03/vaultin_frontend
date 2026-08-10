import { VERIFIED_CONTRACTS_FLAT } from './constants';

// Filter out scam/fake transfers
function isLegitTransfer(tx) {
  if (tx.category === 'external' || tx.category === 'internal') return true;
  return VERIFIED_CONTRACTS_FLAT[tx.rawContract?.address?.toLowerCase()] !== undefined;
}

// Pick the most relevant transfer from a group (prefer erc20/external over internal, then highest value)
function pickPrimary(transfers) {
  const catOrder = { erc20: 0, external: 1, internal: 2 };
  return [...transfers].sort((a, b) => {
    const diff = (catOrder[a.category] ?? 3) - (catOrder[b.category] ?? 3);
    if (diff !== 0) return diff;
    return (b.value || 0) - (a.value || 0);
  })[0];
}

export function mergeTransfers(sentAlchemy, receivedAlchemy, network = 'ethereum') {
  const legitimateSent = sentAlchemy.transfers.filter(isLegitTransfer);
  const legitimateReceived = receivedAlchemy.transfers.filter(isLegitTransfer);

  // Group all transfer events by tx hash
  const groups = new Map();

  for (const t of legitimateSent) {
    const hash = t.hash?.toLowerCase();
    if (!groups.has(hash)) groups.set(hash, { sent: [], received: [] });
    groups.get(hash).sent.push(t);
  }

  for (const t of legitimateReceived) {
    const hash = t.hash?.toLowerCase();
    if (!groups.has(hash)) groups.set(hash, { sent: [], received: [] });
    groups.get(hash).received.push(t);
  }

  const merged = [];

  for (const [, group] of groups) {
    if (group.sent.length > 0 && group.received.length > 0) {
      const primarySent = pickPrimary(group.sent);
      const primaryRecv = pickPrimary(group.received);
      merged.push({
        ...primarySent, direction: 'swapped', network,
        fromValue: primarySent.value, fromAsset: primarySent.asset,
        toValue: primaryRecv.value, toAsset: primaryRecv.asset,
        status: 'confirmed',
      });
    } else if (group.sent.length > 0) {
      const primary = pickPrimary(group.sent);
      merged.push({ ...primary, direction: 'sent', network, status: 'confirmed' });
    } else {
      const primary = pickPrimary(group.received);
      merged.push({ ...primary, direction: 'received', network, status: 'confirmed' });
    }
  }

  merged.sort((a, b) => new Date(b.metadata.blockTimestamp) - new Date(a.metadata.blockTimestamp));
  return merged;
}

// Reverse-calculate running balances from current wallet balances (per-network).
// currentBalances: { networkId: { SYMBOL: balance } }
// Returns: "network:hash" → { symbol, balance } for sent/received
//          "network:hash" → { from: { symbol, balance }, to: { symbol, balance } } for swaps
const GAS_SYMBOLS = { polygon: 'POL' };
function getGasSymbol(network) { return GAS_SYMBOLS[network] || 'ETH'; }

export function computeRunningBalances(transfers, currentBalances, gasFees = {}) {
  if (!currentBalances || Object.keys(currentBalances).length === 0) return {};

  // Initialize per-network running balances from current wallet state
  const running = {};
  for (const [networkId, balances] of Object.entries(currentBalances)) {
    running[networkId] = {};
    for (const [sym, bal] of Object.entries(balances)) {
      running[networkId][sym.toUpperCase()] = bal;
    }
  }

  const result = {};

  for (const tx of transfers) {
    const hash = tx.hash || tx.uniqueId;
    if (!hash) continue;

    const net = tx.network || 'ethereum';
    const key = `${net}:${hash}`;
    if (!running[net]) running[net] = {};
    const netBal = running[net];

    const gasSym = getGasSymbol(net);
    const gasAmt = gasFees[key] || 0;

    if (tx.direction === 'swapped') {
      const fromSym = tx.fromAsset?.toUpperCase();
      const toSym = tx.toAsset?.toUpperCase();
      const fromAmt = parseFloat(tx.fromValue);
      const toAmt = parseFloat(tx.toValue);

      if (fromSym && netBal[fromSym] == null) netBal[fromSym] = 0;
      if (toSym && netBal[toSym] == null) netBal[toSym] = 0;
      if (netBal[gasSym] == null) netBal[gasSym] = 0;

      result[key] = {
        from: fromSym ? { symbol: fromSym, balance: netBal[fromSym] } : null,
        to: toSym ? { symbol: toSym, balance: netBal[toSym] } : null,
      };

      if (fromSym && !isNaN(fromAmt)) netBal[fromSym] += fromAmt;
      if (toSym && !isNaN(toAmt)) netBal[toSym] -= toAmt;
      if (gasAmt) netBal[gasSym] += gasAmt;
    } else {
      const symbol = tx.asset?.toUpperCase();
      const amount = parseFloat(tx.value);
      if (!symbol || isNaN(amount)) continue;

      if (netBal[symbol] == null) netBal[symbol] = 0;
      if (netBal[gasSym] == null) netBal[gasSym] = 0;

      result[key] = { symbol, balance: netBal[symbol] };

      if (tx.direction === 'sent') {
        netBal[symbol] += amount;
      } else if (tx.direction === 'received') {
        netBal[symbol] -= amount;
      }
      if (gasAmt) netBal[gasSym] += gasAmt;
    }
  }

  return result;
}

// Aggregate running balances across all networks (used when no network filter is active).
// Sums current balances across networks per symbol, then reverse-walks transfers.
export function computeAggregateRunningBalances(transfers, currentBalances, gasFees = {}) {
  if (!currentBalances || Object.keys(currentBalances).length === 0) return {};

  const running = {};
  for (const [, balances] of Object.entries(currentBalances)) {
    for (const [sym, bal] of Object.entries(balances)) {
      const key = sym.toUpperCase();
      running[key] = (running[key] || 0) + bal;
    }
  }

  const result = {};

  for (const tx of transfers) {
    const hash = tx.hash || tx.uniqueId;
    if (!hash) continue;

    const net = tx.network || 'ethereum';
    const key = `${net}:${hash}`;

    const gasSym = getGasSymbol(net);
    const gasAmt = gasFees[key] || 0;

    if (tx.direction === 'swapped') {
      const fromSym = tx.fromAsset?.toUpperCase();
      const toSym = tx.toAsset?.toUpperCase();
      const fromAmt = parseFloat(tx.fromValue);
      const toAmt = parseFloat(tx.toValue);

      if (fromSym && running[fromSym] == null) running[fromSym] = 0;
      if (toSym && running[toSym] == null) running[toSym] = 0;
      if (running[gasSym] == null) running[gasSym] = 0;

      result[key] = {
        from: fromSym ? { symbol: fromSym, balance: running[fromSym] } : null,
        to: toSym ? { symbol: toSym, balance: running[toSym] } : null,
      };

      if (fromSym && !isNaN(fromAmt)) running[fromSym] += fromAmt;
      if (toSym && !isNaN(toAmt)) running[toSym] -= toAmt;
      if (gasAmt) running[gasSym] += gasAmt;
    } else {
      const symbol = tx.asset?.toUpperCase();
      const amount = parseFloat(tx.value);
      if (!symbol || isNaN(amount)) continue;

      if (running[symbol] == null) running[symbol] = 0;
      if (running[gasSym] == null) running[gasSym] = 0;

      result[key] = { symbol, balance: running[symbol] };

      if (tx.direction === 'sent') {
        running[symbol] += amount;
      } else if (tx.direction === 'received') {
        running[symbol] -= amount;
      }
      if (gasAmt) running[gasSym] += gasAmt;
    }
  }

  return result;
}
