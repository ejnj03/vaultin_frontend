import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSendTransaction, useWriteContract, useSwitchChain, useAccount, usePublicClient, useSendCalls } from 'wagmi';
import AssetSelector from '../shared/AssetSelector';
import RecipientSelector from './RecipientSelector';
import AmountInput from '../shared/AmountInput';
import BalanceInfo from '../shared/BalanceInfo';
import GasSpeedSelector from '../shared/GasSpeedSelector';
import SwapOptionsSelector from '../shared/SwapOptionsSelector';
import QuoteLoading from '../shared/QuoteLoading';
import ConfirmClearDialog from '../shared/ConfirmClearDialog';
import QuoteSummary from '../shared/QuoteSummary';
import ArrowDivider from '../shared/ArrowDivider';
import { get_quote, execute_quote, execute_swap } from '../../../utils/transactions';
import { useUser } from '../../../contexts/UserContext';
import { useApi } from '../../../hooks/useApi';
import { useGasFees } from '../../../hooks/useGasFees';
import { useCryptoData } from '../../../contexts/CryptoDataContext';
import { augmentContracts, NETWORK_CHAIN_IDS, GAS_LIMITS } from '../../../utils/gasUtils';
import { getTokenBalance } from '../../../utils/balances';
import { decimalsFor, fromBaseUnits, displayAmount, toUsdRaw, toUsdForBalance, DOLLAR_PRESETS, fromUsd, toBaseUnits } from '../../../utils/tokenUtils';
import { CARD, CARD_PRIMARY, INPUT_NUM, LABEL, BTN_READY, BTN_DISABLED, BTN_PROMPT, BTN_LOADING } from '../shared/tradeStyles';

function isSendToSelf(input, username) {
  return input === username;
}

export default function TransferPanel() {
  const [reason, setReason] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [fromNetwork, setFromNetwork] = useState('');
  const [fromToken, setFromToken] = useState('');
  const [toNetwork, setToNetwork] = useState('');
  const [toToken, setToToken] = useState('');
  const [inputSide, setInputSide] = useState('send');
  const [gasSpeed, setGasSpeed] = useState('normal');
  const [gasParams, setGasParams] = useState(null);
  const handleGasSelect = useCallback((key, params) => { setGasSpeed(key); setGasParams(params); }, []);
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
  const [noteTouched, setNoteTouched] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);

  const { sendTransactionAsync } = useSendTransaction();
  const { sendCallsAsync } = useSendCalls();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { userData, walletCapabilities } = useUser();
  const { data: cryptoData } = useCryptoData();
  const { apiCall } = useApi();
  const swapGasParams = useGasFees(fromNetwork);
  const prices = cryptoData || {};

  // Auto-detect direct vs swap based on whether from/to pairs match
  const sameToken = !!(fromNetwork && toNetwork && fromNetwork === toNetwork && fromToken && toToken && fromToken === toToken);

  const handleFromNetworkChange = setFromNetwork;
  const handleFromTokenChange = setFromToken;
  const handleToNetworkChange = setToNetwork;
  const handleToTokenChange = setToToken;

  const fromBalance = useMemo(() => {
    if (!address || !fromNetwork || !fromToken) return null;
    return getTokenBalance(address, fromNetwork, fromToken);
  }, [address, fromNetwork, fromToken]);

  // Validation
  const inputToken = sameToken ? fromToken : (inputSide === 'send' ? fromToken : toToken);
  const exceedsBalance = sameToken && fromBalance !== null && amount && BigInt(amount) > BigInt(fromBalance);
  const exceedsBalanceSend = !sameToken && inputSide === 'send' && fromBalance !== null && amount &&
    BigInt(amount) > BigInt(fromBalance);
  const exceedsBalanceSwap = !sameToken && inputSide === 'receive' && fromBalance !== null && amount && BigInt(amount) > 0n && (() => {
    if (fromBalance === '0') return true;
    const sendUsd = toUsdRaw(fromBaseUnits(fromBalance, fromToken), fromToken, prices);
    const receiveUsd = toUsdRaw(fromBaseUnits(amount, toToken), toToken, prices);
    return sendUsd !== null && receiveUsd !== null && receiveUsd > sendUsd;
  })();
  const invalidAmount = !!amount && BigInt(amount) === 0n;
  const insufficientBalance = exceedsBalance || exceedsBalanceSend || exceedsBalanceSwap;

  const showGasSelector = sameToken && fromNetwork === 'ethereum';
  const showSwapOptions = !sameToken && fromNetwork && toNetwork && fromNetwork === toNetwork;
  const ethPrice = prices?.eth?.usd ?? null;

  // Network fee display for direct transfers
  const networkFeeDisplay = useMemo(() => {
    if (!sameToken || !gasParams || !ethPrice) return null;
    const gasLimit = fromToken === 'ETH' ? GAS_LIMITS.native : GAS_LIMITS.erc20;
    const costWei = gasLimit * gasParams.maxFeePerGas;
    const usd = (Number(costWei) / 1e18) * ethPrice;
    if (usd < 0.01) return '<$0.01';
    return `$${usd.toFixed(2)}`;
  }, [sameToken, gasParams, ethPrice, fromToken]);

  const amountUsd = amount && inputToken ? toUsdForBalance(fromBaseUnits(amount, inputToken), inputToken, prices) : null;

  // Don't block quote fetching with balance checks when user is specifying receive amount
  // (we need the quote to know the actual send cost)
  const balanceOkForQuote = inputSide === 'receive' ? !exceedsBalance : !insufficientBalance;
  // Quote can fetch without recipient (uses self as placeholder)
  const quoteReady = !!(amount && BigInt(amount) > 0n
    && fromNetwork && fromToken && toNetwork && toToken
    && balanceOkForQuote && !invalidAmount);
  const paramsReady = !!(recipient && quoteReady);

  const needsQuote = !sameToken;
  const quoteLoading = needsQuote && quoteReady && !quote;

  // Quote polling (30s) — fetches even without recipient (uses self as placeholder)
  useEffect(() => {
    if (needsQuote && !quotePaused) { setQuote(null); setContracts(null); }
    if (!quoteReady || !needsQuote || quotePaused) return;
    let cancelled = false;
    const isSend = inputSide === 'send';
    const quoteRecipient = recipient || userData?.username;

    const fetchQuote = () => {
      get_quote(apiCall, {
        fromNetwork, fromToken, toNetwork, toToken,
        recipient: quoteRecipient,
        fromAmount: isSend ? amount : null,
        toAmount: isSend ? null : amount,
        urgency: swapUrgency, 
        preference: swapPreference,
        userData: userData,
        walletCapabilities: walletCapabilities  
      }).then(q => {
        console.log("fetched quote: ", q)
        if (cancelled || !q) return;
        setQuote(q.metadata);
        setContracts(q.contracts);
      }).catch(() => {});
    };

    fetchQuote();
    const id = setInterval(fetchQuote, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [quoteReady, needsQuote, quotePaused, recipient, userData?.username, amount, fromNetwork, fromToken, toNetwork, toToken, inputSide, swapUrgency, swapPreference]);

  const canSubmit = reason && paramsReady && (!needsQuote || quote !== null);

  // Handlers
  const handleSendInput = (val) => { if (!sameToken) setInputSide('send'); setAmount(val); setQuotePaused(false); };
  const handleReceiveInput = (val) => { setInputSide('receive'); setAmount(val); setQuotePaused(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNoteTouched(true);
    if (!canSubmit) return;
    if (isSendToSelf(recipient, userData?.username)) return;
    if (submitting) return;
    setSubmitting(true);
    setQuotePaused(false);
    try {
      const fn = fromNetwork, ft = fromToken, tn = toNetwork, tt = toToken;
      const isSend = sameToken || inputSide === 'send';
      const fromAmt = isSend ? amount : null;
      const toAmt = isSend ? null : amount;
      const q = await get_quote(apiCall, {
        fromNetwork: fn, fromToken: ft, toNetwork: tn, toToken: tt,
        recipient, fromAmount: fromAmt, toAmount: toAmt,
        urgency: swapUrgency, preference: swapPreference,
        userData, walletCapabilities,
      });
      if (!q) return;
      const txnDetails = { transferReason: reason, recipient, fromAmount: fromAmt, toAmount: toAmt, fromNetwork: fn, fromToken: ft, toNetwork: tn, toToken: tt };
      if (sameToken) {
        const gasOverrides = showGasSelector && gasParams ? gasParams : {};
        await execute_quote(apiCall, q, txnDetails, { sendTransactionAsync, writeContractAsync, switchChainAsync }, gasOverrides);
      } else {
        const chainId = NETWORK_CHAIN_IDS[fn];
        const augmented = augmentContracts(q.contracts, swapGasParams);
        await execute_swap(apiCall, augmented, txnDetails, { writeContractAsync, switchChainAsync, publicClient, sendCallsAsync, swapGasParams }, chainId, setSubmissionStage);
      }
      // Success — show success state, then clear
      setTxSuccess(true);
      setTimeout(() => setTxSuccess(false), 2500);
      setQuote(null);
      setContracts(null);
    } catch (err) {
      console.error('Transfer failed:', err);
      // Pause polling — leave quote as-is until user changes input
      setQuotePaused(true);
    } finally {
      setSubmitting(false);
      setSubmissionStage(null);
    }
  };

  const handleClearAll = () => {
    setReason(''); setRecipient(''); setAmount('');
    setFromNetwork(''); setFromToken('');
    setToNetwork(''); setToToken(''); setInputSide('send');
    setGasSpeed('normal'); setGasParams(null);
    setSwapUrgency('normal'); setSwapPreference('best_price');
    setQuote(null); setContracts(null); setShowClearConfirm(false);
  };

  const isDirty = reason || recipient || amount || fromNetwork || fromToken || toNetwork || toToken;

  // Computed amounts from quote
  const computedSendAmount = quote && inputSide === 'receive'
    ? (BigInt(quote.swapped) + BigInt(quote.swap_fee)).toString() : null;
  const computedReceiveAmount = quote && inputSide === 'send' ? quote.output : null;
  const computedSendUsd = computedSendAmount ? toUsdForBalance(fromBaseUnits(computedSendAmount, fromToken), fromToken, prices) : null;
  const computedReceiveUsd = computedReceiveAmount ? toUsdForBalance(fromBaseUnits(computedReceiveAmount, toToken), toToken, prices) : null;

  const buttonLabel = !recipient ? 'Select recipient'
    : !fromNetwork || !fromToken ? 'Select send token'
    : !amount ? 'Enter an amount'
    : invalidAmount ? 'Invalid amount'
    : insufficientBalance ? 'Insufficient balance'
    : quoteLoading ? 'Getting quote...'
    : submissionStage === 'waiting_approval' ? 'Waiting for approval...'
    : submissionStage === 'confirming_approval' ? 'Confirming approval...'
    : submitting ? 'Confirming...'
    : 'Transfer';

  const isPromptState = !canSubmit && !submitting && !quoteLoading && (!recipient || !fromToken || !fromNetwork || !amount);
  const formLooksReady = !!(recipient && amount && fromNetwork && fromToken && !insufficientBalance && !invalidAmount);
  const btnClass = !canSubmit || submitting
    ? (quoteLoading || submitting ? BTN_LOADING : formLooksReady ? BTN_READY : isPromptState ? BTN_PROMPT : BTN_DISABLED)
    : BTN_READY;

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      {isDirty && (
        <div className="flex justify-end px-1 mb-1">
          <button type="button" onClick={() => setShowClearConfirm(true)}
            className="text-xs text-base-content/30 hover:text-error transition-colors cursor-pointer">
            Clear all
          </button>
        </div>
      )}
      {/* Send card */}
      <div className={CARD_PRIMARY}>
        <div className="flex items-center justify-between mb-3">
          <span className={LABEL}>You send</span>
          <AssetSelector
            network={fromNetwork} token={fromToken}
            onNetworkChange={handleFromNetworkChange} onTokenChange={handleFromTokenChange}
            address={address} prices={prices}
          />
        </div>

        {(sameToken || inputSide === 'send') ? (
          <>
            <div className="flex items-center gap-2">
              <AmountInput value={amount} onChange={handleSendInput} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(fromToken)} token={fromToken}
                onFocus={() => setFocusedField('send')} onBlur={() => setFocusedField(null)} />
              {fromToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{fromToken}</span>}
            </div>
            {<p className="text-sm text-base-content/40 mt-1 tabular-nums">{amountUsd || '$0.00'}</p>}
          </>
        ) : quoteLoading ? (
          <QuoteLoading />
        ) : computedSendAmount ? (
          <>
            <div className="flex items-center gap-2 cursor-text" onClick={() => handleSendInput(computedSendAmount)}>
              <p className={`${INPUT_NUM} flex-1 text-base-content/50`}>{displayAmount(computedSendAmount, fromToken)}</p>
              {fromToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{fromToken}</span>}
            </div>
            <p className="text-sm text-base-content/40 mt-0.5 tabular-nums">{computedSendUsd || '$0.00'}</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <AmountInput value="" onChange={handleSendInput} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(fromToken)} token={fromToken}
                onFocus={() => setFocusedField('send')} onBlur={() => setFocusedField(null)} />
              {fromToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{fromToken}</span>}
            </div>
            <p className="text-sm text-base-content/40 mt-1 tabular-nums">$0.00</p>
          </>
        )}

        {focusedField === 'send' && (
          <BalanceInfo
            balance={fromBalance} token={fromToken} prices={prices}
            exceeds={insufficientBalance}
            showPresets
            onPresetClick={handleSendInput}
            onClear={amount ? () => handleSendInput('') : undefined}
          />
        )}

        {/* Direct transfer: inline summary inside the send card */}
        {sameToken && amount && BigInt(amount) > 0n && (
          <div className="mt-2 pt-2 border-t border-base-content/5 space-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-base-content/40 tabular-nums">
                {recipient || 'Recipient'} receives {displayAmount(amount, fromToken)} {fromToken}
              </p>
              <button type="button" className="text-[10px] text-primary/60 hover:text-primary transition-colors"
                onClick={() => { setToNetwork(fromNetwork); setToToken(''); }}>
                Send as different token
              </button>
            </div>
            {networkFeeDisplay && (
              <p className="text-[11px] text-base-content/40 tabular-nums">
                Network fee: {networkFeeDisplay}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Directional divider */}
      <ArrowDivider />

      {/* Swap mode: receive card */}
      {!sameToken && (
        <>
          {/* Receive card */}
          <div className={CARD_PRIMARY}>
            <div className="flex items-center justify-between mb-3">
              <span className={LABEL}>{recipient || 'Recipient'} receives</span>
              <AssetSelector
                network={toNetwork} token={toToken}
                onNetworkChange={handleToNetworkChange} onTokenChange={handleToTokenChange}
              />
            </div>

            {inputSide === 'receive' ? (
              <>
                <div className="flex items-center gap-2">
                  <AmountInput value={amount} onChange={handleReceiveInput} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(toToken)} token={toToken}
                    onFocus={() => setFocusedField('receive')} onBlur={() => setFocusedField(null)} />
                  {toToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{toToken}</span>}
                </div>
                <p className="text-sm text-base-content/40 mt-1 tabular-nums">{amountUsd || '$0.00'}</p>
                {focusedField !== 'receive' && exceedsBalanceSwap && <p className="text-[11px] text-error mt-1">Insufficient balance</p>}
              </>
            ) : quoteLoading ? (
              <QuoteLoading />
            ) : computedReceiveAmount ? (
              <>
                <div className="flex items-center gap-2 cursor-text" onClick={() => handleReceiveInput(computedReceiveAmount)}>
                  <p className={`${INPUT_NUM} flex-1 text-base-content/50`}>{displayAmount(computedReceiveAmount, toToken)}</p>
                  {toToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{toToken}</span>}
                </div>
                <p className="text-sm text-base-content/40 mt-0.5 tabular-nums">{computedReceiveUsd || '$0.00'}</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <AmountInput value="" onChange={handleReceiveInput} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(toToken)} token={toToken}
                    onFocus={() => setFocusedField('receive')} onBlur={() => setFocusedField(null)} />
                  {toToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{toToken}</span>}
                </div>
                <p className="text-sm text-base-content/40 mt-1 tabular-nums">$0.00</p>
              </>
            )}

            {focusedField === 'receive' && (
              <div className="flex items-center gap-1.5 mt-2">
                {DOLLAR_PRESETS.map(usd => {
                  const readable = fromUsd(usd, toToken, prices);
                  if (!readable) return null;
                  return (
                    <button key={usd} type="button"
                      className="text-[10px] text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const base = toBaseUnits(readable, toToken);
                        const current = amount && inputSide === 'receive' ? BigInt(amount) : 0n;
                        const incremented = (current + BigInt(base)).toString();
                        handleReceiveInput(incremented);
                      }}>
                      +${usd}
                    </button>
                  );
                })}
                {amount && inputSide === 'receive' && (
                  <button type="button" className="text-[10px] text-red-400 bg-red-900/20 border border-red-800/30 hover:bg-red-900/30 ml-auto px-2 py-0.5 rounded-full transition-colors"
                    onMouseDown={(e) => { e.preventDefault(); handleReceiveInput(''); }}>
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Recipient */}
      <div className={CARD}>
        <div className="flex items-center justify-between">
          <span className={LABEL}>To</span>
          <RecipientSelector value={recipient} onChange={setRecipient} />
        </div>
      </div>

      {/* Note field */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-[11px] text-base-content/30 shrink-0">Note</span>
        <input
          type="text" placeholder="What's this for?"
          value={reason} onChange={(e) => setReason(e.target.value)}
          onBlur={() => setNoteTouched(true)}
          className="bg-transparent text-[11px] w-full outline-none placeholder:text-base-content/15 text-base-content/50"
        />
        {noteTouched && !reason && <span className="text-[10px] text-error/70 shrink-0">Required</span>}
      </div>

      {!sameToken && quote && (
        <QuoteSummary quote={quote} fromToken={fromToken} toToken={toToken} prices={prices} gasParams={swapGasParams} recipient={recipient} />
      )}

      {/* Advanced options — includes gas speed for direct, swap options for swaps */}
      {(showGasSelector || showSwapOptions) && (
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
      {showAdvanced && (showGasSelector || showSwapOptions) && (
        <div className={CARD}>
          <div className="space-y-3">
            {showSwapOptions && (
              <SwapOptionsSelector
                urgency={swapUrgency}
                preference={swapPreference}
                onUrgencyChange={setSwapUrgency}
                onPreferenceChange={setSwapPreference}
              />
            )}
            {showGasSelector && (
              <GasSpeedSelector
                selected={gasSpeed}
                onSelect={handleGasSelect}
                isNative={fromToken === 'ETH'}
                ethPrice={ethPrice}
                network={fromNetwork}
              />
            )}
          </div>
        </div>
      )}

      {txSuccess ? (
        <button type="button" className="btn btn-block rounded-2xl mt-3 text-sm font-bold h-[52px] bg-success text-success-content border-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          Transaction submitted
        </button>
      ) : (
        <button type="submit" className={`${btnClass} relative overflow-hidden`} disabled={(!canSubmit && !isPromptState && !formLooksReady) || submitting}>
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
