import { useState, useMemo, useEffect } from 'react';
import { useAccount, useWriteContract, useSwitchChain, usePublicClient } from 'wagmi';
import AssetSelector from '../shared/AssetSelector';
import AmountInput from '../shared/AmountInput';
import ArrowDivider from '../shared/ArrowDivider';
import BalanceInfo from '../shared/BalanceInfo';
import QuoteLoading from '../shared/QuoteLoading';
import ConfirmClearDialog from '../shared/ConfirmClearDialog';
import { useCryptoData } from '../../../contexts/CryptoDataContext';
import { get_quote, execute_swap } from '../../../utils/transactions';
import { useApi } from '../../../hooks/useApi';
import { useGasFees } from '../../../hooks/useGasFees';
import { getTokenBalance } from '../../../utils/balances';
import { decimalsFor, fromBaseUnits, displayAmount, toUsdRaw, toUsdForBalance, DOLLAR_PRESETS, fromUsd, toBaseUnits } from '../../../utils/tokenUtils';
import { augmentContracts, NETWORK_CHAIN_IDS } from '../../../utils/gasUtils';
import SwapOptionsSelector from '../shared/SwapOptionsSelector';
import QuoteSummary from '../shared/QuoteSummary';
import { formatQuoteBreakdown } from '../../../utils/quoteUtils';
import { CARD, CARD_PRIMARY, INPUT_NUM, LABEL, BTN_READY, BTN_DISABLED, BTN_PROMPT, BTN_LOADING } from '../shared/tradeStyles';

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
  const [contracts, setContracts] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState(null);
  const [quotePaused, setQuotePaused] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [txSuccess, setTxSuccess] = useState(false);

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { data: cryptoData } = useCryptoData();
  const { apiCall } = useApi();
  const gasParams = useGasFees(fromNetwork);
  const prices = cryptoData || {};

  const fromBalance = useMemo(() => {
    if (!address || !fromNetwork || !fromToken) return null;
    return getTokenBalance(address, fromNetwork, fromToken);
  }, [address, fromNetwork, fromToken]);

  // Validation
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

  // USD for the user-typed amount
  const inputToken = inputSide === 'sell' ? fromToken : toToken;
  const amountUsd = amount && inputToken ? toUsdForBalance(fromBaseUnits(amount, inputToken), inputToken, prices) : null;

  // Ready when all params filled
  const paramsReady = !!(fromNetwork && fromToken && toNetwork && toToken && amount && BigInt(amount) > 0n
    && !isSamePair && !insufficientBalance && !invalidAmount);

  // Quote polling (30s to match price feed)
  useEffect(() => {
    if (!quotePaused) { setQuote(null); setContracts(null); }
    if (!paramsReady || quotePaused) return;
    let cancelled = false;
    const isSell = inputSide === 'sell';

    const fetchQuote = () => {
      get_quote(apiCall, {
        fromNetwork, fromToken, toNetwork, toToken,
        recipient: address,
        fromAmount: isSell ? amount : null,
        toAmount: isSell ? null : amount,
        urgency: swapUrgency, preference: swapPreference,
      }).then(q => {
        if (cancelled || !q) return;
        setQuote(q.metadata);
        setContracts(q.contracts);
      });
    };

    fetchQuote();
    const id = setInterval(fetchQuote, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [paramsReady, quotePaused, amount, inputSide, fromNetwork, fromToken, toNetwork, toToken, swapUrgency, swapPreference]);

  const quoteLoading = paramsReady && !quote;
  const canSubmit = paramsReady && quote !== null;

  // Handlers
  const handleSellInput = (val) => { setInputSide('sell'); setAmount(val); setQuotePaused(false); };
  const handleBuyInput = (val) => { setInputSide('buy'); setAmount(val); setQuotePaused(false); };

  const handleFlipTokens = () => {
    setFromNetwork(toNetwork);
    setFromToken(toToken);
    setToNetwork(fromNetwork);
    setToToken(fromToken);
    setAmount('');
    setQuote(null);
    setContracts(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setQuotePaused(false);
    try {
      const isSell = inputSide === 'sell';
      const q = await get_quote(apiCall, {
        fromNetwork, fromToken, toNetwork, toToken,
        recipient: address,
        fromAmount: isSell ? amount : null,
        toAmount: isSell ? null : amount,
        urgency: swapUrgency, preference: swapPreference,
      });
      if (!q?.contracts) return;
      const chainId = NETWORK_CHAIN_IDS[fromNetwork];
      const augmented = augmentContracts(q.contracts, gasParams);
      const txnDetails = {
        fromAmount: isSell ? amount : null,
        toAmount: isSell ? null : amount,
        fromNetwork, fromToken, toNetwork, toToken,
      };
      await execute_swap(apiCall, augmented, txnDetails, { writeContractAsync, switchChainAsync, publicClient }, chainId, setSubmissionStage);
      // Success — show success state, then clear
      setTxSuccess(true);
      setTimeout(() => setTxSuccess(false), 2500);
      setQuote(null);
      setContracts(null);
    } catch (err) {
      console.error('Swap failed:', err);
      // Pause polling — leave quote as-is until user changes input
      setQuotePaused(true);
    } finally {
      setSubmitting(false);
      setSubmissionStage(null);
    }
  };

  const handleClearAll = () => {
    setAmount(''); setFromNetwork(''); setFromToken('');
    setToNetwork(''); setToToken(''); setInputSide('sell');
    setSwapUrgency('normal'); setSwapPreference('best_price');
    setQuote(null); setContracts(null); setShowClearConfirm(false);
  };

  const isDirty = amount || fromNetwork || fromToken || toNetwork || toToken;

  // Computed amounts from quote
  const computedSellAmount = quote && inputSide === 'buy'
    ? (BigInt(quote.swapped) + BigInt(quote.swap_fee)).toString() : null;
  const computedBuyAmount = quote && inputSide === 'sell' ? quote.output : null;

  // USD for computed amounts
  const computedSellUsd = computedSellAmount ? toUsdForBalance(fromBaseUnits(computedSellAmount, fromToken), fromToken, prices) : null;
  const computedBuyUsd = computedBuyAmount ? toUsdForBalance(fromBaseUnits(computedBuyAmount, toToken), toToken, prices) : null;

  // Inline exchange rate for display below Buy panel
  const inlineRate = useMemo(() => {
    if (!quote || !fromToken || !toToken) return null;
    const inReadable = parseFloat(fromBaseUnits(quote.swapped, fromToken));
    const outReadable = parseFloat(fromBaseUnits(quote.output, toToken));
    if (!inReadable || !outReadable) return null;
    const r = outReadable / inReadable;
    return `1 ${fromToken} = ${r >= 1 ? r.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : r.toPrecision(6)} ${toToken}`;
  }, [quote, fromToken, toToken]);

  // Gas fee display for inline display above CTA
  const inlineGasFee = useMemo(() => {
    if (!quote || !gasParams) return null;
    const b = formatQuoteBreakdown(quote, fromToken, toToken, prices, gasParams);
    return b.gasFeeUsd || b.gasFeeEth;
  }, [quote, fromToken, toToken, prices, gasParams]);

  const buttonLabel = !fromNetwork || !fromToken || !toNetwork || !toToken ? 'Select a token'
    : !amount ? 'Enter an amount'
    : invalidAmount ? 'Invalid amount'
    : insufficientBalance ? 'Insufficient balance'
    : isSamePair ? 'Select a different token'
    : quoteLoading ? 'Getting quote...'
    : submissionStage === 'waiting_approval' ? 'Waiting for approval...'
    : submissionStage === 'confirming_approval' ? 'Confirming approval...'
    : submitting ? 'Confirming...'
    : 'Swap';

  const isPromptState = !canSubmit && !submitting && !quoteLoading && (!fromToken || !toToken || !fromNetwork || !toNetwork || !amount);
  const btnClass = !canSubmit || submitting
    ? (quoteLoading || submitting ? BTN_LOADING : isPromptState ? BTN_PROMPT : BTN_DISABLED)
    : BTN_READY;

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      {isDirty && (
        <div className="flex justify-end mb-1">
          <button type="button" onClick={() => setShowClearConfirm(true)}
            className="text-xs text-base-content/30 hover:text-error transition-colors cursor-pointer">
            Clear all
          </button>
        </div>
      )}
      {/* Sell */}
      <div className={CARD_PRIMARY}>
        <div className="flex items-center justify-between mb-3">
          <span className={LABEL}>Sell</span>
          <AssetSelector
            network={fromNetwork} token={fromToken}
            onNetworkChange={setFromNetwork} onTokenChange={setFromToken}
            address={address} prices={prices}
          />
        </div>

        {inputSide === 'sell' ? (
          <>
            <div className="flex items-center gap-2">
              <AmountInput value={amount} onChange={handleSellInput} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(fromToken)} token={fromToken}
                onFocus={() => setFocusedField('sell')} onBlur={() => setFocusedField(null)} />
              {fromToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{fromToken}</span>}
            </div>
            <p className={`text-sm mt-1 tabular-nums ${amountUsd ? 'text-base-content/40' : 'text-base-content/60'}`}>{amountUsd || '$0.00'}</p>
            {focusedField !== 'sell' && exceedsBalanceSell && <p className="text-[11px] text-error mt-1">Insufficient balance</p>}
          </>
        ) : quoteLoading ? (
          <QuoteLoading />
        ) : computedSellAmount ? (
          <>
            <div className="flex items-center gap-2 cursor-text" onClick={() => handleSellInput(computedSellAmount)}>
              <p className={`${INPUT_NUM} flex-1 text-base-content/50`}>{displayAmount(computedSellAmount, fromToken)}</p>
              {fromToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{fromToken}</span>}
            </div>
            <p className="text-sm text-base-content/40 mt-0.5 tabular-nums">{computedSellUsd || '$0.00'}</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <AmountInput value="" onChange={handleSellInput} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(fromToken)} token={fromToken}
                onFocus={() => setFocusedField('sell')} onBlur={() => setFocusedField(null)} />
              {fromToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{fromToken}</span>}
            </div>
            <p className="text-sm text-base-content/60 mt-1 tabular-nums">$0.00</p>
          </>
        )}

        <BalanceInfo
          balance={fromBalance} token={fromToken} prices={prices}
          exceeds={insufficientBalance}
          showPresets={focusedField === 'sell'}
          onPresetClick={handleSellInput}
          onClear={amount ? () => handleSellInput('') : undefined}
        />
      </div>

      <ArrowDivider onClick={handleFlipTokens} />

      {/* Buy */}
      <div className={CARD_PRIMARY}>
        <div className="flex items-center justify-between mb-3">
          <span className={LABEL}>Buy</span>
          <AssetSelector
            network={toNetwork} token={toToken}
            onNetworkChange={setToNetwork} onTokenChange={setToToken}
          />
        </div>

        {inputSide === 'buy' ? (
          <>
            <div className="flex items-center gap-2">
              <AmountInput value={amount} onChange={handleBuyInput} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(toToken)} token={toToken}
                onFocus={() => setFocusedField('buy')} onBlur={() => setFocusedField(null)} />
              {toToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{toToken}</span>}
            </div>
            <p className={`text-sm mt-1 tabular-nums ${amountUsd ? 'text-base-content/40' : 'text-base-content/60'}`}>{amountUsd || '$0.00'}</p>
            {focusedField !== 'buy' && exceedsBalanceBuy && <p className="text-[11px] text-error mt-1">Insufficient balance</p>}
          </>
        ) : quoteLoading ? (
          <QuoteLoading />
        ) : computedBuyAmount ? (
          <>
            <div className="flex items-center gap-2 cursor-text" onClick={() => handleBuyInput(computedBuyAmount)}>
              <p className={`${INPUT_NUM} flex-1 text-base-content/50`}>{displayAmount(computedBuyAmount, toToken)}</p>
              {toToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{toToken}</span>}
            </div>
            <p className="text-sm text-base-content/40 mt-0.5 tabular-nums">{computedBuyUsd || '$0.00'}</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <AmountInput value="" onChange={handleBuyInput} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(toToken)} token={toToken}
                onFocus={() => setFocusedField('buy')} onBlur={() => setFocusedField(null)} />
              {toToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{toToken}</span>}
            </div>
            <p className="text-sm text-base-content/60 mt-1 tabular-nums">$0.00</p>
          </>
        )}

        {focusedField === 'buy' && (
          <div className="flex items-center gap-1.5 mt-2">
            {DOLLAR_PRESETS.map(usd => {
              const tokenAmount = fromUsd(usd, toToken, prices);
              if (!tokenAmount) return null;
              return (
                <button key={usd} type="button"
                  className="text-[10px] text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const currentBase = amount || '0';
                    const addBase = toBaseUnits(tokenAmount, toToken);
                    const sum = (BigInt(currentBase) + BigInt(addBase)).toString();
                    handleBuyInput(sum);
                  }}>
                  +${usd}
                </button>
              );
            })}
            {amount && (
              <button type="button" className="text-[10px] text-red-400 bg-red-900/20 border border-red-800/30 hover:bg-red-900/30 ml-auto px-2 py-0.5 rounded-full transition-colors"
                onMouseDown={(e) => { e.preventDefault(); handleBuyInput(''); }}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline rate + slippage — always visible when quote exists */}
      {inlineRate && (
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-base-content/50 tabular-nums">{inlineRate}</span>
          {quote?.slippage != null && (
            <span className="text-xs text-base-content/40 tabular-nums">Slippage: {quote.slippage}%</span>
          )}
        </div>
      )}

      {quote && (
        <QuoteSummary quote={quote} fromToken={fromToken} toToken={toToken} prices={prices} gasParams={gasParams} />
      )}

      {/* Advanced options */}
      {showSwapOptions && (
        <div className="flex items-center gap-2 px-1">
          <button type="button" onClick={() => setShowAdvanced(o => !o)}
            className="flex items-center gap-1 group cursor-pointer">
            <span className="text-[10px] text-base-content/25 group-hover:text-base-content/40 transition-colors">Advanced</span>
            <svg
              className={`w-2.5 h-2.5 text-base-content/20 group-hover:text-base-content/40 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
      {showAdvanced && showSwapOptions && (
        <div className={CARD}>
          <SwapOptionsSelector
            urgency={swapUrgency}
            preference={swapPreference}
            onUrgencyChange={setSwapUrgency}
            onPreferenceChange={setSwapPreference}
          />
        </div>
      )}

      {inlineGasFee && (
        <p className="text-xs text-base-content/40 text-right px-1">Estimated gas: ~{inlineGasFee}</p>
      )}

      {txSuccess ? (
        <button type="button" className="btn btn-block rounded-2xl mt-3 text-sm font-bold h-[52px] bg-success text-success-content border-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          Transaction submitted
        </button>
      ) : (
        <button type="submit" className={`${btnClass} relative overflow-hidden`} disabled={(!canSubmit && !isPromptState) || submitting}>
          {(quoteLoading || submitting) && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-base-content/[0.07] to-transparent"
              style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}
            />
          )}
          {(quoteLoading || submitting) ? <><span className="loading loading-spinner loading-xs mr-2" />{buttonLabel}</> : buttonLabel}
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
