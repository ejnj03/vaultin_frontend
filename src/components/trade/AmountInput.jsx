import { useRef, useState, useEffect } from 'react';
import { toBaseUnits, fromBaseUnits } from '../../utils/tokenUtils';

// AmountInput accepts and emits base-unit strings (e.g. wei).
// It manages a local display string so intermediate typing states
// like "1." or "0.0" are preserved.
export default function AmountInput({ value, onChange, disabled, className, decimals = 2, token, ...props }) {
  const inputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState('');
  const lastEmitted = useRef({ value: null, token: null });

  // Sync display from external value changes (presets, clear, token switch)
  useEffect(() => {
    if (value === lastEmitted.current.value && token === lastEmitted.current.token) return;
    lastEmitted.current = { value: value ?? '', token };
    if (!value || value === '') {
      setDisplayValue('');
    } else {
      const readable = fromBaseUnits(value, token);
      if (decimals <= 2) {
        const num = parseFloat(readable);
        setDisplayValue(isNaN(num) || num === 0 ? '' : num.toFixed(decimals));
      } else {
        // Truncate to display decimals and pad for consistency
        const [whole, frac = ''] = readable.split('.');
        setDisplayValue(`${whole}.${(frac + '0'.repeat(decimals)).slice(0, decimals)}`);
      }
    }
  }, [value, token, decimals]);

  const emit = (readable) => {
    const base = (!readable || readable === '.') ? '' : toBaseUnits(readable, token);
    lastEmitted.current = { value: base, token };
    onChange(base);
  };

  // Stablecoins (≤2 decimals): currency-style right-fill input
  if (decimals <= 2) {
    const factor = Math.pow(10, decimals);
    const toCents = (d) => (!d ? 0 : Math.round(parseFloat(d) * factor));
    const fromCents = (c) => (c / factor).toFixed(decimals);

    const handleKeyDown = (e) => {
      if (disabled) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const cents = toCents(displayValue) * 10 + parseInt(e.key);
        const newDisplay = fromCents(cents);
        setDisplayValue(newDisplay);
        emit(newDisplay);
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        const cents = Math.floor(toCents(displayValue) / 10);
        if (cents === 0) {
          setDisplayValue('');
          emit('');
        } else {
          const newDisplay = fromCents(cents);
          setDisplayValue(newDisplay);
          emit(newDisplay);
        }
        return;
      }
      if (e.key.length === 1) e.preventDefault();
    };

    return (
      <input
        ref={inputRef} type="text" inputMode="decimal"
        placeholder="0.00" value={displayValue}
        onKeyDown={handleKeyDown} onChange={() => {}}
        disabled={disabled} className={className} {...props}
      />
    );
  }

  // Crypto tokens (>2 decimals): free-form decimal input
  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setDisplayValue('');
      emit('');
      return;
    }
    if (/^\d*\.?\d*$/.test(raw)) {
      const parts = raw.split('.');
      if (parts[1] && parts[1].length > decimals) return;
      setDisplayValue(raw);
      emit(raw);
    }
  };

  return (
    <input
      ref={inputRef} type="text" inputMode="decimal"
      placeholder={`0.${'0'.repeat(decimals)}`} value={displayValue}
      onChange={handleChange}
      disabled={disabled} className={className} {...props}
    />
  );
}
