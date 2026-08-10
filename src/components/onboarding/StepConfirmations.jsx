import ChoiceCard from "./ChoiceCard";
import { CONFIRMATION_OPTIONS, SLIDE_FWD, SLIDE_BACK, BTN_PRIMARY, BTN_BACK, FwdIcon, BwdIcon } from "./constants";

export default function StepConfirmations({ data, setData, onNext, onBack, dir }) {
  return (
    <div className={dir >= 0 ? SLIDE_FWD : SLIDE_BACK}>
      <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-base-content/40 mb-2.5">
        Step 2 of 4
      </div>
      <div className="text-[19px] font-bold tracking-tight text-base-content leading-tight mb-6">
        How much detail do you want when signing transactions?
      </div>
      <div className="flex flex-col gap-2.5 mb-6">
        {CONFIRMATION_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.id}
            selected={data.confirmations === opt.id}
            onClick={() => setData((d) => ({ ...d, confirmations: opt.id }))}
            title={opt.title}
            desc={opt.desc}
          />
        ))}
      </div>
      <div className="flex gap-2.5">
        <button onClick={onBack} className={BTN_BACK}><BwdIcon /> Back</button>
        <button onClick={onNext} disabled={!data.confirmations} className={BTN_PRIMARY}>Continue <FwdIcon /></button>
      </div>
    </div>
  );
}
