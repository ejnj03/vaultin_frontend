export const NETWORKS = [
  { id: "arb", label: "Arbitrum", color: "#12AAFF" },
  { id: "base", label: "Base", color: "#0052FF" },
  { id: "op", label: "Optimism", color: "#FF0420" },
  { id: "eth", label: "Ethereum", color: "#627EEA" },
  { id: "poly", label: "Polygon", color: "#8247E5" },
];

export const TOKENS = [
  { id: "usdc", label: "USDC" },
  { id: "usdt", label: "USDT" },
  { id: "eth", label: "ETH" },
  { id: "pol", label: "POL" },
];

export const CONFIRMATION_OPTIONS = [
  { id: "simple", title: "Simple summary", label: "Simple", desc: "Just the key info before I confirm." },
  { id: "detailed", title: "Full breakdown", label: "Full", desc: "Show me what I'm signing, routing, and fees at every step." },
];

export const APPROVAL_OPTIONS = [
  { id: "separate", title: "Separate", label: "Separate", desc: "Approve first, then transact. I want to see each step." },
  { id: "combined", title: "Combined when possible", label: "Combined", desc: "Fewer signatures, even if it costs slightly more upfront." },
];

export const SETTINGS_DEFAULTS = {
  confirmations: "simple",
  approvals: "combined",
  receiveNetwork: null,
  receiveToken: null,
};

export const SETTINGS_LABELS = {
  confirmations: "Transaction detail",
  approvals: "Approval flow",
  receiveNetwork: "Default network",
  receiveToken: "Default token",
};

export const STEP_LABELS = ["Profile", "Confirmations", "Approvals", "Receive"];

// Shared animation classes
export const SLIDE_FWD = "animate-[ob-slide-fwd_0.26s_cubic-bezier(0.2,0,0.2,1)_both]";
export const SLIDE_BACK = "animate-[ob-slide-back_0.26s_cubic-bezier(0.2,0,0.2,1)_both]";

// Shared button styles
export const BTN_PRIMARY = "btn btn-primary flex-[2] rounded-xl text-sm font-bold shadow-[0_0_28px_oklch(64%_0.155_152_/_0.2)] disabled:bg-base-content/5 disabled:text-base-content/15 disabled:shadow-none flex items-center justify-center gap-1.5";
export const BTN_BACK = "btn btn-ghost flex-1 rounded-xl border-[1.5px] border-base-content/10 text-base-content/40 font-semibold text-sm flex items-center justify-center gap-1.5";

// Shared nav icons
export function FwdIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function BwdIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
