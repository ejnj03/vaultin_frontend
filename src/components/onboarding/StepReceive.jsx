import { NETWORKS, TOKENS, SLIDE_FWD, SLIDE_BACK, BTN_BACK, FwdIcon, BwdIcon } from "./constants";

export default function StepReceive({ data, setData, onFinish, onBack, dir, registering }) {
  const tog = (key, id) => setData((d) => ({ ...d, [key]: d[key] === id ? null : id }));
  const hasAny = data.receiveNetwork || data.receiveToken;

  return (
    <div className={dir >= 0 ? SLIDE_FWD : SLIDE_BACK}>
      <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-base-content/40 mb-2.5">
        Step 4 of 4
      </div>
      <div className="text-[19px] font-bold tracking-tight text-base-content leading-tight mb-6">
        Default receive preferences?
      </div>

      <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-base-content/40 mb-2">
        Network
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {NETWORKS.map((n) => (
          <button
            key={n.id}
            onClick={() => tog("receiveNetwork", n.id)}
            className="px-3 py-1.5 rounded-full border-[1.5px] text-[13px] font-semibold cursor-pointer transition-all duration-150"
            style={
              data.receiveNetwork === n.id
                ? { borderColor: n.color, background: `${n.color}12`, color: n.color, boxShadow: `0 0 10px ${n.color}20` }
                : { borderColor: "oklch(84% 0 0 / 0.2)", color: "oklch(84% 0 0 / 0.4)" }
            }
          >
            {n.label}
          </button>
        ))}
      </div>

      <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-base-content/40 mb-2">
        Token
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {TOKENS.map((t) => (
          <button
            key={t.id}
            onClick={() => tog("receiveToken", t.id)}
            className={`px-3 py-1.5 rounded-full border-[1.5px] text-[13px] font-semibold cursor-pointer transition-all duration-150 ${
              data.receiveToken === t.id
                ? "border-primary bg-primary/[0.07] text-primary/80 shadow-[0_0_10px_oklch(64%_0.155_152_/_0.1)]"
                : "border-base-content/15 text-base-content/40 hover:border-base-content/20 hover:text-base-content/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-base-content/40 mb-5 leading-relaxed">
        You can change this anytime in settings.
      </p>

      <div className="flex gap-2.5">
        <button onClick={onBack} className={BTN_BACK}><BwdIcon /> Back</button>
        <button
          onClick={onFinish}
          disabled={registering}
          className="btn btn-primary flex-[2] rounded-xl text-sm font-bold shadow-[0_0_28px_oklch(64%_0.155_152_/_0.2)] flex items-center justify-center gap-1.5"
        >
          {registering ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <>{hasAny ? "Finish setup" : "Skip for now"} <FwdIcon /></>
          )}
        </button>
      </div>
    </div>
  );
}
