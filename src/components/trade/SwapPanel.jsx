import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import AssetSelector from './AssetSelector';
import AmountInput from './AmountInput';
import ArrowDivider from './ArrowDivider';
import BalanceInfo from './BalanceInfo';
import QuoteLoading from './QuoteLoading';
import ConfirmClearDialog from './ConfirmClearDialog';
import { useCryptoData } from '../../contexts/CryptoDataContext';
import { get_quote } from '../../utils/transactions';
import { useApi } from '../../hooks/useApi';
import { getTokenBalance } from '../../utils/balances';
import { decimalsFor, toBaseUnits, fromBaseUnits, toUsd, toUsdRaw, fromUsd, DOLLAR_PRESETS } from '../../utils/tokenUtils';
import SwapOptionsSelector from './SwapOptionsSelector';
import { CARD, INPUT_NUM, LABEL, BTN } from './tradeStyles';

export default function SwapPanel() {
  const [amount, setAmount] = useState('');
  const [fromNetwork, setFromNetwork] = useState('');
  const [fromToken, setFromToken] = useState('');
  const [toNetwork, setToNetwork] = useState('');
  const [toToken, setToToken] = useState('');
  const [inputSide, setInputSide] = useState('sell');
  const [swapUrgency, setSwapUrgency] = useState('normal');
  const [swapPreference, setSwapPreference] = useState('best_price');
  const [quote, setQuote] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { address } = useAccount();
  const { data: cryptoData } = useCryptoData();
  const { apiCall } = useApi();
  const prices = cryptoData || {};

  const fromBalance = useMemo(() => {
    if (!address || !fromNetwork || !fromToken) return null;
    return getTokenBalance(address, fromNetwork, fromToken);
  }, [address, fromNetwork, fromToken]);

  // Which token does the amount refer to?
  const inputToken = inputSide === 'sell' ? fromToken : toToken;

  // Validation (BigInt comparison — no floating point)
  const exceedsBalanceSell = inputSide === 'sell' && fromBalance !== null && amount &&
    BigInt(amount) > BigInt(fromBalance);
  const exceedsBalanceBuy = inputSide === 'buy' && fromBalance !== null && amount && BigInt(amount) > 0n && (() => {
    if (fromBalance === '0') return true;
    const sellUsd = toUsdRaw(fromBaseUnits(fromBalance, fromToken), fromToken, prices);
    const buyUsd = toUsdRaw(fromBaseUnits(amount, toToken), toToken, prices);
    return sellUsd !== null && buyUsd !== null && buyUsd > sellUsd;
  })();
  const insufficientBalance = exceedsBalanceSell || exceedsBalanceBuy;
  const invalidAmount = !!amount && BigInt(amount) === 0n;
  const isSamePair = fromToken && toToken && fromToken === toToken && fromNetwork === toNetwork;
  const showSwapOptions = fromNetwork && toNetwork && fromNetwork === toNetwork && !isSamePair;

  // USD display
  const amountUsd = amount && inputToken ? toUsd(fromBaseUnits(amount, inputToken), inputToken, prices) : null;

  // Ready when all params filled
  const paramsReady = !!(fromNetwork && fromToken && toNetwork && toToken && amount && BigInt(amount) > 0n
    && !isSamePair && !insufficientBalance && !invalidAmount);

  useEffect(() => {
    setQuote(null);
    if (!paramsReady) return;
    // TODO: fetch quote from API, then call setQuote(result)
    console.log('[SwapPanel] params ready — fetch quote', { amount, inputSide, fromNetwork, fromToken, toNetwork, toToken });
  }, [paramsReady, amount, inputSide, fromNetwork, fromToken, toNetwork, toToken]);

  const canSubmit = paramsReady && quote !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isSell = inputSide === 'sell';
    const q = await get_quote(apiCall, {
      fromNetwork, fromToken, toNetwork, toToken,
      recipient: null,
      fromAmount: isSell ? amount : null,
      toAmount: isSell ? null : amount,
      urgency: swapUrgency, preference: swapPreference,
    });
    console.log('swap quote:', q);
  };

  const handlePresetClick = (val) => setAmount(val);

  const handleClearAll = () => {
    setAmount('');
    setFromNetwork('');
    setFromToken('');
    setToNetwork('');
    setToToken('');
    setInputSide('sell');
    setSwapUrgency('normal');
    setSwapPreference('best_price');
    setQuote(null);
    setShowClearConfirm(false);
  };

  const isDirty = amount || fromNetwork || fromToken || toNetwork || toToken;

  // Loading state: params ready but no quote yet
  const quoteLoading = paramsReady && !quote;

  const buttonLabel = !fromNetwork || !fromToken || !toNetwork || !toToken ? 'Select a token'
    : !amount ? 'Enter an amount'
    : invalidAmount ? 'Invalid amount'
    : insufficientBalance ? 'Insufficient balance'
    : isSamePair ? 'Select a different token'
    : quoteLoading ? 'Getting quote...'
    : 'Swap';

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      {/* Sell */}
      <div className={CARD}>
        <div className="flex items-center justify-between mb-3">
          <span className={LABEL}>{inputSide === 'sell' ? 'Sell' : (quoteLoading ? 'Sell' : 'Sell as')}</span>
          <AssetSelector
            network={fromNetwork} token={fromToken}
            onNetworkChange={setFromNetwork} onTokenChange={setFromToken}
            label={inputSide === 'sell' ? 'Sell as' : undefined}
          />
        </div>

        {inputSide === 'sell' && (
          <>
            <div className="flex items-center gap-2">
              <AmountInput value={amount} onChange={setAmount} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(fromToken)} token={fromToken} />
              {fromToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{fromToken}</span>}
            </div>
            {amountUsd && <p className="text-[11px] text-base-content/20 mt-1">{amountUsd}</p>}
            {exceedsBalanceSell && <p className="text-[11px] text-error mt-1">Insufficient balance</p>}
          </>
        )}

        {inputSide === 'buy' && quoteLoading && <QuoteLoading />}

        <BalanceInfo
          balance={fromBalance} token={fromToken} prices={prices}
          exceeds={insufficientBalance}
          showPresets={inputSide === 'sell'}
          onPresetClick={handlePresetClick}
        />
      </div>

      <ArrowDivider
        onClick={() => { setInputSide(s => s === 'sell' ? 'buy' : 'sell'); setAmount(''); setQuote(null); }}
        flipped={inputSide === 'buy'}
      />

      {/* Buy */}
      <div className={CARD}>
        <div className="flex items-center justify-between mb-3">
          <span className={LABEL}>{inputSide === 'buy' ? 'Buy' : (quoteLoading ? 'Receive' : 'Receive as')}</span>
          <AssetSelector
            network={toNetwork} token={toToken}
            onNetworkChange={setToNetwork} onTokenChange={setToToken}
            label={inputSide === 'buy' ? 'Receive as' : undefined}
          />
        </div>

        {inputSide === 'buy' && (
          <>
            <div className="flex items-center gap-2">
              <AmountInput value={amount} onChange={setAmount} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(toToken)} token={toToken} />
              {toToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{toToken}</span>}
            </div>
            {amountUsd && <p className="text-[11px] text-base-content/20 mt-1">{amountUsd}</p>}
            {exceedsBalanceBuy && <p className="text-[11px] text-error mt-1">Insufficient balance</p>}

            {toToken && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {DOLLAR_PRESETS.map(usd => {
                  const tokenAmount = fromUsd(usd, toToken, prices);
                  return (
                    <button key={usd} type="button" className="text-[10px] text-primary/70 hover:text-primary bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-full transition-colors"
                      onClick={() => {
                        if (!tokenAmount) return;
                        const currentBase = amount || '0';
                        const addBase = toBaseUnits(tokenAmount, toToken);
                        const sum = (BigInt(currentBase) + BigInt(addBase)).toString();
                        setAmount(sum);
                      }}>
                      +${usd}
                    </button>
                  );
                })}
                {amount && (
                  <button type="button" className="text-[10px] text-error/70 hover:text-error bg-error/5 hover:bg-error/10 px-2 py-0.5 rounded-full transition-colors"
                    onClick={() => setAmount('')}>
                    Clear
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {inputSide === 'sell' && quoteLoading && <QuoteLoading />}
      </div>

      {/* Swap options (same network, different token) */}
      {showSwapOptions && (
        <SwapOptionsSelector
          urgency={swapUrgency}
          preference={swapPreference}
          onUrgencyChange={setSwapUrgency}
          onPreferenceChange={setSwapPreference}
        />
      )}

      <button type="submit" className={`${BTN} relative overflow-hidden`} disabled={!canSubmit}>
        {quoteLoading && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
            style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}
          />
        )}
        {quoteLoading ? <><span className="loading loading-dots loading-xs mr-2" />{buttonLabel}</> : buttonLabel}
      </button>

      {isDirty && (
        <button type="button" onClick={() => setShowClearConfirm(true)}
          className="btn btn-ghost btn-xs w-full mt-1 text-base-content/30 hover:text-error">
          Clear all
        </button>
      )}

      <ConfirmClearDialog
        open={showClearConfirm}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </form>
  );
}
