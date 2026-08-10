import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { NETWORKS, TOKENS, FwdIcon } from "./constants";

export default function DoneScreen({ data }) {
  const navigate = useNavigate();
  const { setUserData } = useUser();

  const confirmations = data.confirmations ?? "simple";
  const approvals = data.approvals ?? "separate";
  const network = data.receiveNetwork ?? "base";
  const token = data.receiveToken ?? "usdc";

  const wasDefaulted = {
    confirmations: !data.confirmations,
    approvals: !data.approvals,
    network: !data.receiveNetwork,
    token: !data.receiveToken,
  };

  const cLabel = confirmations === "simple" ? "Simple summary" : "Full breakdown";
  const aLabel = approvals === "separate" ? "Separate" : "Combined";
  const nLabel = NETWORKS.find((n) => n.id === network)?.label ?? "Base";
  const tLabel = TOKENS.find((t) => t.id === token)?.label ?? "USDC";

  const rows = [
    { name: "Transaction confirmations", hint: "Controls how much detail you see before signing a transaction.", val: cLabel, defaulted: wasDefaulted.confirmations },
    { name: "Token approval flow", hint: null, val: aLabel, defaulted: wasDefaulted.approvals },
    { name: "Default receive network", hint: null, val: nLabel, defaulted: wasDefaulted.network },
    { name: "Default receive token", hint: null, val: tLabel, defaulted: wasDefaulted.token },
  ];

  const handleGo = () => {
    setUserData({ username: data.username });
    navigate("/wallet");
  };

  return (
    <div className="text-center max-w-md w-full flex flex-col items-center animate-[ob-drop_0.4s_ease_both]">
      {/* Checkmark circle */}
      <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-primary to-success mb-5.5 flex items-center justify-center shadow-[0_0_52px_oklch(64%_0.155_152_/_0.32)]">
        <svg className="[&_polyline]:animate-[ob-check_0.4s_0.15s_ease_forwards] [&_polyline]:[stroke-dasharray:30] [&_polyline]:[stroke-dashoffset:30]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="oklch(7.4% 0 0)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div className="text-[22px] font-extrabold tracking-tight text-base-content mb-2">
        You're in, {data.name || "there"}.
      </div>
      <div className="text-[13.5px] text-base-content/40 leading-relaxed mb-7">
        Your identity is live and preferences are set. Change anything anytime from your profile.
      </div>

      {/* Identity summary */}
      <div className="flex items-center gap-3.5 w-full mb-5 bg-base-200 border border-base-content/10 rounded-[14px] p-3.5">
        <div className="w-11 h-11 rounded-full shrink-0 bg-base-100 border-[1.5px] border-base-content/10 flex items-center justify-center overflow-hidden">
          {data.photoPreview ? (
            <img src={data.photoPreview} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-base-content/20">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-bold text-base-content tracking-tight mb-0.5">{data.name || "\u2014"}</div>
          <div className="text-xs font-mono text-primary tracking-wide">@{data.username || "\u2014"}</div>
        </div>
      </div>

      {/* Settings preview */}
      <div className="w-full bg-base-200 border border-base-content/10 rounded-2xl overflow-hidden mb-6 text-left">
        <div className="px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest text-base-content/30 border-b border-base-content/10">
          Your settings
        </div>
        {rows.map((r) => (
          <div key={r.name} className="flex items-start px-4 py-3 gap-3 border-b border-base-content/10 last:border-b-0">
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-base-content tracking-tight mb-0.5">{r.name}</div>
              {r.hint && <div className="text-[11px] text-base-content/30 leading-snug mt-0.5">{r.hint}</div>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {r.defaulted && (
                <span className="text-[9px] font-mono text-base-content/30 uppercase tracking-widest">default</span>
              )}
              <span
                className={`text-[11.5px] font-mono font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                  r.defaulted
                    ? "text-base-content/40 bg-base-300 border border-base-content/10"
                    : "text-primary bg-primary/[0.07] border border-primary/15"
                }`}
              >
                {r.val}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleGo}
        className="btn btn-primary w-full rounded-xl text-sm font-bold shadow-[0_0_28px_oklch(64%_0.155_152_/_0.2)] hover:shadow-[0_0_38px_oklch(64%_0.155_152_/_0.3)] flex items-center justify-center gap-1.5"
      >
        Go to dashboard <FwdIcon />
      </button>
    </div>
  );
}
