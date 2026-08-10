import { useState } from 'react';
import { CARD, LABEL } from './tradeStyles';

const URGENCY_OPTIONS = [
  { key: 'normal', label: 'Normal' },
  { key: 'fast', label: 'Fast' },
  { key: 'urgent', label: 'Urgent' },
];

const PREFERENCE_OPTIONS = [
  { key: 'best_price', label: 'Best price' },
  { key: 'fastest', label: 'Fastest' },
];

function SectionToggle({ label, summary, open, onToggle, children }) {
  return (
    <div>
      <button
        type="button" onClick={onToggle}
        className="flex items-center justify-between w-full group cursor-pointer"
      >
        <span className={LABEL}>{label}</span>
        <div className="flex items-center gap-1.5">
          {!open && <span className="text-[11px] text-primary/60 font-medium">{summary}</span>}
          <svg
            className={`w-3.5 h-3.5 text-base-content/30 group-hover:text-base-content/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr] mt-2' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export default function SwapOptionsSelector({ urgency, preference, onUrgencyChange, onPreferenceChange }) {
  const [urgencyOpen, setUrgencyOpen] = useState(false);
  const [preferenceOpen, setPreferenceOpen] = useState(false);

  const urgencyLabel = URGENCY_OPTIONS.find(o => o.key === urgency)?.label ?? 'Normal';
  const preferenceLabel = PREFERENCE_OPTIONS.find(o => o.key === preference)?.label ?? 'Best price';

  return (
    <div className={`${CARD} space-y-3`}>
      {/* Urgency */}
      <SectionToggle label="Urgency" summary={urgencyLabel} open={urgencyOpen} onToggle={() => setUrgencyOpen(o => !o)}>
        <div className="grid grid-cols-3 gap-2">
          {URGENCY_OPTIONS.map(({ key, label }) => {
            const active = urgency === key;
            return (
              <button
                key={key} type="button"
                onClick={() => onUrgencyChange(key)}
                className={`rounded-xl py-2 px-3 text-center transition-colors cursor-pointer border ${
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-base-content/10 bg-base-content/[0.03] hover:bg-base-content/[0.06]'
                }`}
              >
                <p className={`text-xs font-semibold ${active ? 'text-primary' : 'text-base-content/70'}`}>{label}</p>
              </button>
            );
          })}
        </div>
      </SectionToggle>

      {/* Preference */}
      <SectionToggle label="Preference" summary={preferenceLabel} open={preferenceOpen} onToggle={() => setPreferenceOpen(o => !o)}>
        <div className="grid grid-cols-2 gap-2">
          {PREFERENCE_OPTIONS.map(({ key, label }) => {
            const active = preference === key;
            return (
              <button
                key={key} type="button"
                onClick={() => onPreferenceChange(key)}
                className={`rounded-xl py-2 px-3 text-center transition-colors cursor-pointer border ${
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-base-content/10 bg-base-content/[0.03] hover:bg-base-content/[0.06]'
                }`}
              >
                <p className={`text-xs font-semibold ${active ? 'text-primary' : 'text-base-content/70'}`}>{label}</p>
              </button>
            );
          })}
        </div>
      </SectionToggle>
    </div>
  );
}
