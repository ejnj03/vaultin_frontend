import { STEP_LABELS } from "./constants";

export default function StepTrack({ current }) {
  return (
    <div className="w-full mb-7 flex items-start animate-[ob-drop_0.45s_0.04s_ease_both]">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold font-mono transition-all duration-300 ${
                  done
                    ? "bg-primary text-primary-content"
                    : active
                      ? "bg-primary/[0.06] border-[1.5px] border-primary text-primary shadow-[0_0_14px_oklch(64%_0.155_152_/_0.18)]"
                      : "border-[1.5px] border-base-content/20 text-base-content/35"
                }`}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[9px] font-mono font-bold uppercase tracking-widest transition-colors duration-300 ${
                  done ? "text-base-content/40" : active ? "text-primary" : "text-base-content/40"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`flex-1 h-px mx-1 mb-5 transition-colors duration-300 ${
                  done ? "bg-primary/35" : "bg-base-content/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
