import { useState, useEffect, useMemo, useRef } from 'react';
import { ConnectKitButton } from 'connectkit';

/* ─── animated hero background ─── */
function HeroBackground() {
  const particles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.5 + 0.2,
    })), []);

  const shapes = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 30 + 10,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 hero-gradient-bg" />
      <div className="glow-orb w-[400px] h-[400px] bg-primary/20 top-[10%] left-[15%]" style={{ animationDuration: '6s' }} />
      <div className="glow-orb w-[500px] h-[500px] bg-secondary/15 bottom-[10%] right-[10%]" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      <div className="glow-orb w-[300px] h-[300px] bg-accent/10 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '10s', animationDelay: '4s' }} />
      {particles.map((p) => (
        <div key={p.id} className="particle bg-primary" style={{ left: p.left, width: p.size, height: p.size, opacity: p.opacity, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }} />
      ))}
      {shapes.map((s) => (
        <div key={s.id} className="drift-shape border border-primary/10" style={{ left: s.left, top: s.top, width: s.size, height: s.size, borderRadius: s.id % 2 === 0 ? '50%' : '2px', transform: `rotate(${s.rotation}deg)`, animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }} />
      ))}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-base-100/80 via-transparent to-base-100/60" />
    </div>
  );
}

/* ─── hero payment demo ─── */
function PaymentDemo() {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Alice picks ETH on Arbitrum', icon: '\u2197' },
    { label: 'Vaultin routes bridge + swap', icon: '\u26A1' },
    { label: 'Bob receives USDC on Polygon', icon: '\u2713' },
    { label: 'One click. Done.', icon: '\uD83D\uDD12' },
  ];
  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className="bg-base-200/80 backdrop-blur-sm rounded-box border border-base-content/10 p-6 shadow-2xl shadow-primary/5 cursor-pointer select-none hover:border-primary/20 transition-colors"
        onClick={() => setStep(s => (s + 1) % 4)}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-primary font-extrabold text-lg">V</span>
            <span className="text-xs text-base-content/40 font-medium">Payment</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${step > i ? 'bg-success' : step === i ? 'bg-primary' : 'bg-base-content/10'}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">A</div>
            <div>
              <p className="text-sm font-semibold">@alice.vault</p>
              <p className="text-[10px] text-base-content/30">Sending</p>
            </div>
          </div>
          <div className="flex-1 mx-3 border-t border-dashed border-base-content/10 relative">
            <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs transition-all duration-300 ${step === 1 ? 'text-primary scale-125' : 'text-base-content/20'}`}>
              {steps[step].icon}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-semibold text-right">@bob.vault</p>
              <p className="text-[10px] text-base-content/30 text-right">Receives</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary text-xs font-bold">B</div>
          </div>
        </div>
        <div className="bg-base-300/50 rounded-lg p-3 mb-4 text-center border border-base-content/5">
          <p className="text-2xl font-bold tabular-nums">$50.00</p>
          <p className="text-[11px] text-base-content/40 mt-0.5">USDC on Polygon</p>
        </div>
        <div className="flex items-center gap-2 mb-3">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-base-content/10'}`} />
          ))}
        </div>
        <p className={`text-xs text-center transition-all duration-300 ${step === 3 ? 'text-success font-medium' : 'text-base-content/40'}`}>
          {steps[step].label}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-base-content/5">
          <span className="text-[10px] text-base-content/25">{step === 3 ? 'Replay' : 'Click to continue'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-base-content/20">
            {step === 3
              ? <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1Z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            }
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   FEATURE DEMO WIDGETS — only animate when active
   ════════════════════════════════════════════════ */

/* 1 ─── Cross-chain route visualization ─── */
function CrossChainDemo({ active }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) setPhase(0);
  }, [active]);

  const chains = [
    { name: 'Arbitrum', color: '#12AAFF', token: 'ETH' },
    { name: 'Vaultin', color: '#4ade80', token: '' },
    { name: 'Polygon', color: '#8247E5', token: 'USDC' },
  ];

  return (
    <div
      className="bg-base-200/80 backdrop-blur-sm rounded-box border border-base-content/10 p-6 shadow-2xl shadow-primary/5 h-full cursor-pointer select-none hover:border-primary/20 transition-colors"
      onClick={() => setPhase(p => (p + 1) % 5)}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-primary font-extrabold text-lg">V</span>
          <span className="text-xs text-base-content/40 font-medium">Route</span>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all duration-300 ${phase >= 4 ? 'bg-success/15 text-success' : 'bg-base-content/5 text-base-content/30'}`}>
          {phase >= 4 ? 'Delivered' : 'Routing...'}
        </span>
      </div>
      <div className="flex items-center justify-between mb-5">
        {chains.map((c, i) => (
          <div key={c.name} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-500 ${phase >= i * 2 ? 'scale-100 opacity-100' : 'scale-75 opacity-30'}`}
              style={{
                borderColor: phase >= i * 2 ? c.color : 'transparent',
                backgroundColor: phase >= i * 2 ? c.color + '18' : 'transparent',
                color: c.color,
              }}
            >
              {i === 1 ? 'V' : c.token}
            </div>
            <span className="text-[10px] text-base-content/40">{c.name}</span>
          </div>
        ))}
      </div>
      <div className="relative h-2 mx-6 mb-5">
        <div className="absolute inset-0 bg-base-content/5 rounded-full" />
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(phase * 25, 100)}%`, background: 'linear-gradient(90deg, #12AAFF, #4ade80, #8247E5)' }}
        />
      </div>
      <div className="bg-base-300/50 rounded-lg p-3 border border-base-content/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-base-content/30">Send</p>
            <p className={`text-sm font-bold tabular-nums transition-all duration-300 ${phase >= 1 ? 'text-base-content' : 'text-base-content/20'}`}>0.015 ETH</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-all duration-500 ${phase >= 2 ? 'text-primary' : 'text-base-content/10'}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
          <div className="text-right">
            <p className="text-xs text-base-content/30">Receive</p>
            <p className={`text-sm font-bold tabular-nums transition-all duration-300 ${phase >= 3 ? 'text-base-content' : 'text-base-content/20'}`}>50.00 USDC</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-base-content/5">
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= phase ? 'bg-primary' : 'bg-base-content/10'}`} />
          ))}
        </div>
        <span className="text-[10px] text-base-content/25 ml-2">{phase >= 4 ? 'Replay' : 'Click'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-base-content/20">
          {phase >= 4
            ? <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1Z" clipRule="evenodd" />
            : <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          }
        </svg>
      </div>
    </div>
  );
}

/* 2 ─── Username resolution animation ─── */
function UsernameDemo({ active }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) setPhase(0);
  }, [active]);

  return (
    <div
      className="bg-base-200/80 backdrop-blur-sm rounded-box border border-base-content/10 p-6 shadow-2xl shadow-secondary/5 h-full cursor-pointer select-none hover:border-secondary/20 transition-colors"
      onClick={() => setPhase(p => (p + 1) % 4)}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-secondary font-extrabold text-lg">V</span>
          <span className="text-xs text-base-content/40 font-medium">Identity</span>
        </div>
        <span className="text-[10px] bg-secondary/10 text-secondary font-medium px-2 py-0.5 rounded-full">Free</span>
      </div>
      <div className="bg-base-300/50 rounded-lg border border-base-content/5 p-4 mb-4">
        <p className="text-[10px] text-base-content/30 mb-2 uppercase tracking-wider">Recipient</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative h-7 overflow-hidden">
            <p className={`font-mono text-sm absolute inset-0 flex items-center transition-all duration-500 ${phase === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <span className="text-base-content/40">0x4919...3C53</span>
            </p>
            <p className={`text-sm absolute inset-0 flex items-center gap-2 transition-all duration-500 ${phase === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="loading loading-dots loading-xs text-secondary" />
              <span className="text-base-content/30">Resolving...</span>
            </p>
            <p className={`text-sm font-semibold absolute inset-0 flex items-center transition-all duration-500 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="text-secondary">@alice.vault</span>
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${phase >= 2 ? 'bg-success/15' : 'bg-base-content/5'}`}>
            {phase >= 2 ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-success">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="w-2 h-2 rounded-full bg-base-content/10" />
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { name: 'alice.vault', addr: '0x4919...3C53', highlight: phase >= 2 },
          { name: 'bob.vault', addr: '0x7B2F...A1D8', highlight: false },
          { name: 'carol.vault', addr: '0xE3C1...9F42', highlight: false },
        ].map((u) => (
          <div key={u.name} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 ${u.highlight ? 'bg-secondary/8 border border-secondary/15' : 'border border-transparent'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${u.highlight ? 'bg-secondary/15 text-secondary' : 'bg-base-content/5 text-base-content/20'}`}>
              {u.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${u.highlight ? 'text-base-content' : 'text-base-content/30'}`}>@{u.name}</p>
              <p className="text-[10px] text-base-content/20 font-mono">{u.addr}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-base-content/5">
        <div className="flex gap-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= phase ? 'bg-secondary' : 'bg-base-content/10'}`} />
          ))}
        </div>
        <span className="text-[10px] text-base-content/25 ml-2">{phase >= 3 ? 'Replay' : 'Click'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-base-content/20">
          {phase >= 3
            ? <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1Z" clipRule="evenodd" />
            : <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          }
        </svg>
      </div>
    </div>
  );
}

/* 3 ─── Scheduled payments visual ─── */
function ScheduleDemo({ active }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) setTick(0);
  }, [active]);

  const payments = [
    { to: '@landlord.vault', amount: '1,200 USDC', day: '1st', done: tick >= 1 },
    { to: '@netflix.vault', amount: '15.99 USDC', day: '5th', done: tick >= 2 },
    { to: '@gym.vault', amount: '49.00 USDC', day: '10th', done: tick >= 3 },
    { to: '@savings.vault', amount: '500 USDC', day: '15th', done: tick >= 4 },
  ];

  return (
    <div
      className="bg-base-200/80 backdrop-blur-sm rounded-box border border-base-content/10 p-6 shadow-2xl shadow-accent/5 h-full cursor-pointer select-none hover:border-accent/20 transition-colors"
      onClick={() => setTick(t => (t + 1) % 6)}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-accent font-extrabold text-lg">V</span>
          <span className="text-xs text-base-content/40 font-medium">Schedule</span>
        </div>
        <span className="text-[10px] text-base-content/30 font-medium">Feb 2026</span>
      </div>
      <div className="flex gap-1 mb-5">
        {Array.from({ length: 28 }, (_, i) => {
          const isPayDay = [0, 4, 9, 14].includes(i);
          const isPast = i < (tick * 5);
          return (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${isPayDay && isPast ? 'bg-accent' : isPayDay ? 'bg-accent/25' : isPast ? 'bg-base-content/8' : 'bg-base-content/4'}`} />
          );
        })}
      </div>
      <div className="space-y-2">
        {payments.map((p, i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-500 ${p.done ? 'bg-accent/[0.04] border-accent/10' : 'border-base-content/5 bg-base-300/30'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${p.done ? 'bg-accent/15' : 'bg-base-content/5'}`}>
              {p.done ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-accent">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-base-content/15" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium transition-colors duration-300 ${p.done ? 'text-base-content' : 'text-base-content/30'}`}>{p.to}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-xs font-bold tabular-nums transition-colors duration-300 ${p.done ? 'text-base-content' : 'text-base-content/25'}`}>{p.amount}</p>
              <p className="text-[9px] text-base-content/20">{p.day} monthly</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-base-content/5">
        <span className={`text-[10px] font-semibold tabular-nums transition-all duration-300 ${tick >= 4 ? 'text-accent' : 'text-base-content/30'}`}>
          {payments.filter(p => p.done).length}/{payments.length} paid
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-base-content/25">{tick >= 5 ? 'Replay' : 'Click'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-base-content/20">
            {tick >= 5
              ? <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1Z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            }
          </svg>
        </div>
      </div>
    </div>
  );
}

/* 4 ─── Payment requests visual ─── */
function RequestDemo({ active }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) setStep(0);
  }, [active]);

  const requests = [
    { from: 'carol', emoji: 'C', amount: '32.50', note: 'Dinner split', color: '#f472b6' },
    { from: 'dave', emoji: 'D', amount: '15.00', note: 'Coffee run', color: '#60a5fa' },
    { from: 'eve', emoji: 'E', amount: '120.00', note: 'Concert tickets', color: '#c084fc' },
  ];

  return (
    <div
      className="bg-base-200/80 backdrop-blur-sm rounded-box border border-base-content/10 p-6 shadow-2xl shadow-info/5 h-full cursor-pointer select-none hover:border-info/20 transition-colors"
      onClick={() => setStep(s => (s + 1) % 5)}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-info font-extrabold text-lg">V</span>
          <span className="text-xs text-base-content/40 font-medium">Requests</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-info" />
          </span>
          <span className="text-[10px] text-info font-medium">3 pending</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {requests.map((r, i) => {
          const isApproving = step === i + 1;
          const isApproved = step > i + 1;
          return (
            <div key={i} className={`rounded-lg border p-3.5 transition-all duration-500 ${isApproved ? 'bg-success/[0.04] border-success/15' : 'bg-base-300/30 border-base-content/5'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: r.color + '18', color: r.color }}>
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">@{r.from}.vault</p>
                    <p className="text-xs font-bold tabular-nums">${r.amount}</p>
                  </div>
                  <p className="text-[10px] text-base-content/30 mt-0.5">{r.note}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {isApproved ? (
                  <div className="flex items-center gap-1.5 text-success">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-medium">Paid</span>
                  </div>
                ) : (
                  <>
                    <div className={`flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold transition-all duration-400 ${isApproving ? 'bg-success text-success-content scale-[0.97]' : 'bg-success/10 text-success'}`}>
                      {isApproving ? 'Sending...' : 'Approve'}
                    </div>
                    <div className="h-7 w-7 rounded-md bg-base-content/5 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-base-content/20">
                        <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-base-content/5">
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-info' : 'bg-base-content/10'}`} />
          ))}
        </div>
        <span className="text-[10px] text-base-content/25 ml-2">{step >= 4 ? 'Replay' : 'Click'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-base-content/20">
          {step >= 4
            ? <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1Z" clipRule="evenodd" />
            : <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          }
        </svg>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   FEATURE TABS — interactive showcase
   ════════════════════════════════════════ */

const FEATURES = [
  {
    key: 'crosschain',
    title: 'Cross-Chain Payments',
    desc: 'Send from any token on any chain. Vaultin handles the bridge, swap, and delivery in a single transaction.',
    color: 'primary',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    key: 'username',
    title: 'Human-Readable Addresses',
    desc: 'Send to @alice.vault instead of hex addresses. Free to register, works across all chains.',
    color: 'secondary',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    key: 'schedule',
    title: 'Scheduled Payments',
    desc: 'Automate rent, subscriptions, and payroll. Set it once, Vaultin handles the rest every month.',
    color: 'accent',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    key: 'requests',
    title: 'Payment Requests',
    desc: 'Request money from anyone by @username. They tap approve, done. No hex addresses needed.',
    color: 'info',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
      </svg>
    ),
  },
];

function FeatureShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);

  const demos = {
    crosschain: CrossChainDemo,
    username: UsernameDemo,
    schedule: ScheduleDemo,
    requests: RequestDemo,
  };

  const ActiveDemo = demos[FEATURES[activeIdx].key];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
      {/* Left: tabs */}
      <div className="space-y-2">
        {FEATURES.map((f, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={f.key}
              onClick={() => setActiveIdx(i)}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 ${
                isActive
                  ? `bg-${f.color}/[0.06] border-${f.color}/20`
                  : 'bg-transparent border-base-content/5 hover:border-base-content/10 hover:bg-base-content/[0.02]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${isActive ? `bg-${f.color}/15 text-${f.color}` : 'bg-base-content/5 text-base-content/25'}`}>
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <h3 className={`font-semibold text-sm transition-colors duration-300 ${isActive ? 'text-base-content' : 'text-base-content/50'}`}>
                    {f.title}
                  </h3>
                  <p className={`text-xs leading-relaxed mt-0.5 transition-all duration-300 ${isActive ? 'text-base-content/50 max-h-20 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    {f.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right: active demo — click the card to step through */}
      <div className="relative min-h-[380px]">
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <ActiveDemo active key={FEATURES[activeIdx].key} />
        </div>
      </div>
    </div>
  );
}

/* ─── scroll-reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Step Flow Demo for "How It Works" ─── */
function StepFlowDemo() {
  const [phase, setPhase] = useState(0);

  const chains = ['Arbitrum', 'Polygon', 'Optimism', 'Base'];
  const tokens = [
    { symbol: 'ETH', color: '#627EEA' },
    { symbol: 'USDC', color: '#2775CA' },
    { symbol: 'DAI', color: '#F5AC37' },
    { symbol: 'WBTC', color: '#F09242' },
  ];

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className="bg-base-200/80 backdrop-blur-sm rounded-box border border-base-content/10 p-6 shadow-2xl shadow-primary/5 cursor-pointer select-none hover:border-primary/20 transition-colors"
        onClick={() => setPhase(p => (p + 1) % 4)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-primary font-extrabold text-lg">V</span>
            <span className="text-xs text-base-content/40 font-medium">Send</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${phase > i ? 'bg-primary' : phase === i ? 'bg-primary/50 animate-pulse' : 'bg-base-content/10'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Token selector */}
        <div className={`mb-4 transition-all duration-500 ${phase === 0 ? 'opacity-100' : 'opacity-40'}`}>
          <p className="text-[10px] text-base-content/30 uppercase tracking-wider mb-2">Step 1 — Select Token</p>
          <div className="grid grid-cols-4 gap-1.5">
            {tokens.map((t, i) => (
              <div
                key={t.symbol}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all duration-500 ${
                  phase >= 1 && i === 0
                    ? 'border-primary/30 bg-primary/8 scale-[1.02]'
                    : 'border-base-content/5 bg-base-300/30'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ backgroundColor: t.color + '20', color: t.color }}
                >
                  {t.symbol[0]}
                </div>
                <span className="text-[9px] font-medium text-base-content/50">{t.symbol}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {chains.map((c, i) => (
              <span
                key={c}
                className={`text-[8px] px-1.5 py-0.5 rounded-full transition-all duration-500 ${
                  phase >= 1 && i === 0
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'bg-base-content/5 text-base-content/20'
                }`}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Step 2: Recipient input */}
        <div className={`mb-4 transition-all duration-500 ${phase === 1 ? 'opacity-100' : phase > 1 ? 'opacity-40' : 'opacity-20'}`}>
          <p className="text-[10px] text-base-content/30 uppercase tracking-wider mb-2">Step 2 — Recipient</p>
          <div className="bg-base-300/50 rounded-lg border border-base-content/5 px-3 py-2.5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-base-content/20 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <div className="relative h-5 flex-1 overflow-hidden">
              <span className={`absolute inset-0 flex items-center text-xs transition-all duration-500 ${phase < 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
                <span className="text-base-content/20">Enter @username...</span>
              </span>
              <span className={`absolute inset-0 flex items-center text-xs transition-all duration-500 ${phase === 1 ? 'opacity-100 translate-y-0' : phase > 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <span className="text-secondary font-medium">@bob.vault</span>
              </span>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${phase >= 2 ? 'bg-success/15' : 'bg-base-content/5'}`}>
              {phase >= 2 ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-success">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-base-content/10" />
              )}
            </div>
          </div>
          <div className={`flex items-center justify-between mt-2 transition-all duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-[10px] text-base-content/20">Amount</span>
            <span className="text-sm font-bold tabular-nums">$50.00 <span className="text-[10px] font-normal text-base-content/30">USDC</span></span>
          </div>
        </div>

        {/* Step 3: Send button */}
        <div className={`transition-all duration-500 ${phase === 2 ? 'opacity-100' : phase > 2 ? 'opacity-100' : 'opacity-20'}`}>
          <div className={`w-full py-3 rounded-lg text-sm font-semibold text-center transition-all duration-700 ${
            phase === 3
              ? 'bg-success text-success-content'
              : phase === 2
                ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                : 'bg-base-content/5 text-base-content/20'
          }`}>
            {phase === 3 ? 'Sent!' : phase === 2 ? 'Confirm & Send' : 'Send'}
          </div>
          {/* Route summary */}
          <div className={`flex items-center justify-center gap-2 mt-3 transition-all duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#627EEA]/10 text-[#627EEA]">ETH</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-base-content/15">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Vaultin</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-base-content/15">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#2775CA]/10 text-[#2775CA]">USDC</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-base-content/5">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= phase ? 'bg-primary' : 'bg-base-content/10'}`} />
            ))}
          </div>
          <span className="text-[10px] text-base-content/25 ml-2">{phase === 3 ? 'Replay' : 'Click'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-base-content/20">
            {phase === 3
              ? <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1Z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            }
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─── how-it-works step ─── */
function Step({ number, title, desc, delay }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`flex gap-5 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {number}
        </div>
        {number < 3 && <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-2" />}
      </div>
      <div className="pb-8">
        <h4 className="font-semibold text-base-content mb-1">{title}</h4>
        <p className="text-sm text-base-content/40 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ════════════ MAIN ════════════ */
function Home() {
  return (
    <div className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="hero min-h-[90vh] relative overflow-hidden">
        <HeroBackground />
        <div className="hero-content flex-col lg:flex-row-reverse gap-12 lg:gap-16 relative z-10 px-6 py-16 max-w-6xl mx-auto">
          <div className="flex-1 w-full max-w-md hidden md:block">
            <PaymentDemo />
          </div>
          <div className="flex-1 text-center lg:text-left">
            <div className="badge badge-outline badge-primary gap-2 mb-6 py-3 px-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Cross-Chain Payments
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight">
              Pay anyone,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                any token,
              </span><br />
              any chain.
            </h1>
            <p className="py-6 text-lg text-base-content/50 max-w-md leading-relaxed lg:mx-0 mx-auto">
              No more bridging, swapping, then sending. Vaultin abstracts cross-chain complexity into one click — so crypto payments finally feel like Venmo.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <ConnectKitButton.Custom>
                {({ isConnected, show, truncatedAddress, ensName }) => (
                  <button onClick={show} className="btn btn-primary btn-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow">
                    {isConnected ? ensName ?? truncatedAddress : "Launch App"}
                  </button>
                )}
              </ConnectKitButton.Custom>
              <a href="#features" className="btn btn-ghost btn-lg border border-base-content/10 hover:border-primary/30">
                See Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase ─── */}
      <section id="features" className="py-24 px-6 border-t border-base-content/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-3">Everything crypto payments should be.</h2>
            <p className="text-base-content/40 max-w-lg mx-auto">Four features that make sending crypto as easy as sending a text.</p>
          </div>
          <FeatureShowcase />
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 px-6 bg-base-200/40 border-y border-base-content/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-3">Three steps. One click.</h2>
            <p className="text-base-content/40 mb-10 max-w-md">Today, cross-chain payments take 3 transactions, 3 sets of gas fees, and 5 minutes of friction. Vaultin compresses that into a single action.</p>
            <Step number={1} title="Pick your token" desc="Choose any token you hold on any supported chain. ETH on Arbitrum, MATIC on Polygon — doesn't matter." delay={0} />
            <Step number={2} title="Enter recipient" desc="Type a @username or paste a wallet address. Set the token and amount they should receive." delay={100} />
            <Step number={3} title="One-click send" desc="Vaultin routes the optimal path — bridge, swap, deliver — all behind the scenes in a single approval." delay={200} />
          </div>
          <div className="hidden lg:block">
            <StepFlowDemo />
          </div>
        </div>
      </section>

      {/* ─── Comparison Section ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Crypto payments today are broken.</h2>
          <p className="text-center text-base-content/40 mb-12 max-w-lg mx-auto">Here's what sending $50 across chains looks like — with and without Vaultin.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-box border border-error/20 bg-error/[0.03] p-6">
              <p className="text-xs uppercase tracking-wider text-error font-semibold mb-4">Without Vaultin</p>
              <ul className="space-y-3">
                {['Bridge ETH from Arbitrum to Polygon', 'Wait for bridge confirmation', 'Swap ETH for USDC on Polygon', 'Approve USDC spending', 'Send USDC to recipient address', 'Copy-paste 42-char hex address'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-base-content/50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-error/60 shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-error/10 flex items-center justify-between">
                <span className="text-xs text-base-content/30">Time</span>
                <span className="text-sm font-semibold text-error">~5-10 min, 3+ tx fees</span>
              </div>
            </div>
            <div className="rounded-box border border-success/20 bg-success/[0.03] p-6">
              <p className="text-xs uppercase tracking-wider text-success font-semibold mb-4">With Vaultin</p>
              <ul className="space-y-3">
                {['Pick any token on any chain', 'Send to @username', 'Confirm once'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-base-content/70">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-success shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-success/10 flex items-center justify-between">
                <span className="text-xs text-base-content/30">Time</span>
                <span className="text-sm font-semibold text-success">~10 seconds, 1 approval</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="max-w-xl mx-auto relative z-10">
          <h2 className="text-4xl font-bold mb-4">Ready to enter the Vault?</h2>
          <p className="text-base-content/40 mb-8 max-w-md mx-auto">
            Connect your wallet to start sending cross-chain payments with zero friction.
          </p>
          <ConnectKitButton.Custom>
            {({ isConnected, show, truncatedAddress, ensName }) => (
              <button onClick={show} className="btn btn-primary btn-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow">
                {isConnected ? ensName ?? truncatedAddress : "Connect Wallet"}
              </button>
            )}
          </ConnectKitButton.Custom>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="footer footer-center bg-base-300/50 border-t border-base-content/5 text-base-content p-10">
        <p className="text-base-content/30 text-sm">Vaultin &copy; 2026</p>
      </footer>
    </div>
  );
}

export default Home;
