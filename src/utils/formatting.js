export function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString())
    return date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (date.getFullYear() === now.getFullYear())
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function fmtAmount(v, decimals = 2) {
  if (v == null || v === 0) return '0';
  const abs = Math.abs(v);
  if (abs < 0.01) return abs.toFixed(5);
  if (abs >= 1000) return abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return abs.toFixed(decimals);
}

export function fmtAmount6(v) {
  if (v == null || v === 0) return '0';
  const abs = Math.abs(Number(v));
  if (isNaN(abs)) return String(v);
  if (abs < 0.000001) return '<0.000001';
  const s = abs.toPrecision(6);
  if (s.includes('e')) return parseFloat(s).toLocaleString('en-US', { maximumFractionDigits: 10 });
  return s.replace(/\.?0+$/, '');
}

export function fmtAmountFull(v) {
  if (v == null || v === 0) return '0';
  const abs = Math.abs(v);
  if (abs < 0.01) return abs.toFixed(8);
  if (abs >= 1000) return abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  return abs.toFixed(5);
}

export function formatFullDate(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function fmtGasEth(v) {
  if (v == null || v === 0) return null;
  if (v < 0.000001) return '<0.000001 ETH';
  return parseFloat(v.toPrecision(4)).toString() + ' ETH';
}

export function fmtUsd(v) {
  if (v == null || v === 0) return null;
  if (Math.abs(v) < 0.01) return '<$0.01';
  return `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function timeAgo(unixSeconds) {
  const diff = Math.floor(Date.now() / 1000) - Number(unixSeconds);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w`;
  return `${Math.floor(diff / 2592000)}mo`;
}

export function timeAgoLong(unixSeconds) {
  const diff = Math.floor(Date.now() / 1000) - Number(unixSeconds);
  if (diff < 60) return 'just now';
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} minute${m !== 1 ? 's' : ''} ago`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hour${h !== 1 ? 's' : ''} ago`; }
  if (diff < 604800) { const d = Math.floor(diff / 86400); return `${d} day${d !== 1 ? 's' : ''} ago`; }
  if (diff < 2592000) { const w = Math.floor(diff / 604800); return `${w} week${w !== 1 ? 's' : ''} ago`; }
  if (diff < 31536000) { const mo = Math.floor(diff / 2592000); return `${mo} month${mo !== 1 ? 's' : ''} ago`; }
  return new Date(Number(unixSeconds) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function truncateAddr(addr) {
  if (!addr) return '—';
  if (addr.startsWith('@')) return addr;
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
