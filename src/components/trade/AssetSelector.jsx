import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_TOKENS } from '../../utils/constants';
import { NETWORK_LOGOS, NETWORK_NAMES, TOKEN_LOGOS } from '../../utils/networkLogos';

export default function AssetSelector({ network, token, onNetworkChange, onTokenChange, label }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(network ? 'token' : 'network');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setStep(network ? 'token' : 'network');
    setOpen(!open);
  };

  const selectNetwork = (n) => {
    onNetworkChange(n);
    onTokenChange('');
    setStep('token');
  };

  const selectToken = (t) => {
    onTokenChange(t);
    setOpen(false);
  };

  const networks = Object.keys(SUPPORTED_TOKENS);
  const tokens = network ? SUPPORTED_TOKENS[network] : [];
  const hasSelection = network && token;

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-full h-8 px-2.5 text-sm font-semibold whitespace-nowrap bg-base-content/8 hover:bg-base-content/12 text-base-content transition-colors"
      >
        {hasSelection ? (
          <>
            <div className="relative">
              <img src={TOKEN_LOGOS[token] || NETWORK_LOGOS[network]} className="w-5 h-5 rounded-full" alt={token} />
              <img src={NETWORK_LOGOS[network]} className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-base-300" alt={network} />
            </div>
            <span>{token}</span>
          </>
        ) : (
          <span className="text-base-content/50">{label || 'Select token'}</span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-base-content/30">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-base-100 border border-base-content/10 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
          {step === 'network' ? (
            <>
              <p className="text-[10px] text-base-content/30 font-semibold uppercase tracking-wider px-4 py-1.5">Select network</p>
              {networks.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => selectNetwork(n)}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-left transition-colors ${
                    n === network ? 'bg-primary/10 text-primary' : 'hover:bg-base-content/5'
                  }`}
                >
                  <img src={NETWORK_LOGOS[n]} className="w-7 h-7 rounded-full" alt={n} />
                  <span className="text-sm font-medium">{NETWORK_NAMES[n]}</span>
                  {n === network && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('network')}
                className="flex items-center gap-2 w-full px-4 py-1.5 text-[10px] text-base-content/30 hover:text-base-content/50 uppercase tracking-wider font-semibold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                </svg>
                <img src={NETWORK_LOGOS[network]} className="w-3.5 h-3.5 rounded-full" alt={network} />
                {NETWORK_NAMES[network]}
              </button>
              {tokens.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => selectToken(t)}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-left transition-colors ${
                    t === token ? 'bg-primary/10 text-primary' : 'hover:bg-base-content/5'
                  }`}
                >
                  <img src={TOKEN_LOGOS[t] || NETWORK_LOGOS[network]} className="w-7 h-7 rounded-full" alt={t} />
                  <span className="text-sm font-medium">{t}</span>
                  {t === token && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
