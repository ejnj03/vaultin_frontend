import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSendTransaction, useWriteContract, useSwitchChain, useAccount } from 'wagmi';
import AssetSelector from './AssetSelector';
import RecipientSelector from './RecipientSelector';
import AmountInput from './AmountInput';
import ArrowDivider from './ArrowDivider';
import BalanceInfo from './BalanceInfo';
import GasSpeedSelector from './GasSpeedSelector';
import SwapOptionsSelector from './SwapOptionsSelector';
import QuoteLoading from './QuoteLoading';
import ConfirmClearDialog from './ConfirmClearDialog';
import { get_quote, execute_quote } from '../../utils/transactions';
import { useUser } from '../../contexts/UserContext';
import { useApi } from '../../hooks/useApi';
import { useCryptoData } from '../../contexts/CryptoDataContext';
import { getTokenBalance } from '../../utils/balances';
import { decimalsFor, toBaseUnits, fromBaseUnits, toUsd, toUsdRaw, fromUsd, DOLLAR_PRESETS } from '../../utils/tokenUtils';
import { CARD, INPUT_NUM, INPUT_TEXT, LABEL, BTN } from './tradeStyles';

function isSendToSelf(input, username) {
  return input === username;
}

export default function TransferPanel() {
  const [reason, setReason] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sameToken, setSameToken] = useState(true);
  const [fromNetwork, setFromNetwork] = useState('');
  const [fromToken, setFromToken] = useState('');
  const [toNetwork, setToNetwork] = useState('');
  const [toToken, setToToken] = useState('');
  const [inputSide, setInputSide] = useState('receive');
  const [gasSpeed, setGasSpeed] = useState('normal');
  const [gasParams, setGasParams] = useState(null);
  const handleGasSelect = useCallback((key, params) => { setGasSpeed(key); setGasParams(params); }, []);
  const [swapUrgency, setSwapUrgency] = useState('normal');
  const [swapPreference, setSwapPreference] = useState('best_price');
  const [quote, setQuote] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const { address } = useAccount();
  const { username } = useUser();
  const { data: cryptoData } = useCryptoData();
  const { apiCall } = useApi();
  const prices = cryptoData || {};

  const effectiveToNetwork = sameToken ? fromNetwork : toNetwork;
  const effectiveToToken = sameToken ? fromToken : toToken;

  const fromBalance = useMemo(() => {
    if (!address || !fromNetwork || !fromToken) return null;
    return getTokenBalance(address, fromNetwork, fromToken);
  }, [address, fromNetwork, fromToken]);

  // Which token does the amount refer to?
  const inputToken = sameToken ? fromToken : (inputSide === 'send' ? fromToken : toToken);

  // Validation (BigInt comparison — no floating point)
  const exceedsBalance = sameToken && fromBalance !== null && amount &&
    BigInt(amount) > BigInt(fromBalance);
  const exceedsBalanceSend = !sameToken && inputSide === 'send' && fromBalance !== null && amount &&
    BigInt(amount) > BigInt(fromBalance);
  const exceedsBalanceSwap = !sameToken && inputSide === 'receive' && fromBalance !== null && amount && BigInt(amount) > 0n && (() => {
    if (fromBalance === '0') return true;
    const sendUsd = toUsdRaw(fromBaseUnits(fromBalance, fromToken), fromToken, prices);
    const receiveUsd = toUsdRaw(fromBaseUnits(amount, effectiveToToken), effectiveToToken, prices);
    return sendUsd !== null && receiveUsd !== null && receiveUsd > sendUsd;
  })();
  const invalidAmount = !!amount && BigInt(amount) === 0n;
  const isSamePair = !sameToken && fromNetwork === toNetwork && fromToken === toToken;
  const insufficientBalance = exceedsBalance || exceedsBalanceSend || exceedsBalanceSwap;

  const showGasSelector = sameToken && fromNetwork === 'ethereum';
  const showSwapOptions = !sameToken && fromNetwork && toNetwork && fromNetwork === toNetwork;
  const ethPrice = prices?.eth?.usd ?? null;

  // USD displays
  const amountUsd = amount ? toUsd(fromBaseUnits(amount, inputToken), inputToken, prices) : null;

  // Ready when all params filled (excluding reason)
  const paramsReady = !!(recipient && amount && BigInt(amount) > 0n
    && fromNetwork && fromToken && effectiveToNetwork && effectiveToToken
    && !isSamePair && !insufficientBalance && !invalidAmount);

  // Quote: only needed for different-token transfers
  const needsQuote = !sameToken;
  const quoteLoading = needsQuote && paramsReady && !quote;

  useEffect(() => {
    if (needsQuote) setQuote(null);
    if (!paramsReady || !needsQuote) return;
    let cancelled = false;
    const isSend = inputSide === 'send';
    get_quote(apiCall, {
      fromNetwork, fromToken, toNetwork: effectiveToNetwork, toToken: effectiveToToken,
      recipient,
      fromAmount: isSend ? amount : null,
      toAmount: isSend ? null : amount,
      urgency: swapUrgency, preference: swapPreference,
    }).then(q => { if (!cancelled) setQuote(q); });
    return () => { cancelled = true; };
  }, [paramsReady, needsQuote, recipient, amount, fromNetwork, fromToken, effectiveToNetwork, effectiveToToken, inputSide, sameToken, swapUrgency, swapPreference]);

  const canSubmit = reason && paramsReady && (!needsQuote || quote !== null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSendToSelf(recipient, username)) return;

    const fn = fromNetwork, ft = fromToken, tn = effectiveToNetwork, tt = effectiveToToken;
    const isSend = sameToken || inputSide === 'send';
    const fromAmt = isSend ? amount : null;
    const toAmt = isSend ? null : amount;
    const q = await get_quote(apiCall, {
      fromNetwork: fn, fromToken: ft, toNetwork: tn, toToken: tt,
      recipient, fromAmount: fromAmt, toAmount: toAmt,
      urgency: swapUrgency, preference: swapPreference,
    });
    const txn_details = { transferReason: reason, fromAmount: fromAmt, toAmount: toAmt, fromNetwork: fn, fromToken: ft, toNetwork: tn, toToken: tt };
    const gasOverrides = showGasSelector && gasParams ? gasParams : {};
    await execute_quote(apiCall, q, txn_details, { sendTransactionAsync, writeContractAsync, switchChainAsync }, gasOverrides);
  };

  const handleClearAll = () => {
    setReason('');
    setRecipient('');
    setAmount('');
    setSameToken(true);
    setFromNetwork('');
    setFromToken('');
    setToNetwork('');
    setToToken('');
    setInputSide('receive');
    setGasSpeed('normal');
    setGasParams(null);
    setSwapUrgency('normal');
    setSwapPreference('best_price');
    setQuote(null);
    setShowClearConfirm(false);
  };

  const isDirty = reason || recipient || amount || fromNetwork || fromToken || toNetwork || toToken;

  const buttonLabel = !fromNetwork || !fromToken ? 'Select send token'
    : !recipient ? 'Select recipient'
    : !amount ? 'Enter an amount'
    : invalidAmount ? 'Invalid amount'
    : insufficientBalance ? 'Insufficient balance'
    : isSamePair ? 'Select a different token'
    : quoteLoading ? 'Getting quote...'
    : 'Transfer';

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      {/* Reason */}
      <div className={CARD}>
        <span className={LABEL}>Reason</span>
        <input
          type="text" placeholder="What's this for?"
          value={reason} onChange={(e) => setReason(e.target.value)}
          className={`${INPUT_TEXT} mt-2`}
        />
      </div>

      {/* Same token toggle */}
      <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none">
        <input
          type="checkbox" className="toggle toggle-primary toggle-xs"
          checked={sameToken} onChange={(e) => setSameToken(e.target.checked)}
        />
        <span className="text-xs text-base-content/30">Same token (no swap)</span>
      </label>

      {/* From (your wallet) */}
      <div className={CARD}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className={LABEL}>{sameToken ? 'Send to' : (inputSide === 'send' ? 'You send' : (quoteLoading ? 'You send' : 'You send as'))}</span>
            {sameToken && <RecipientSelector value={recipient} onChange={setRecipient} />}
          </div>
          <AssetSelector
            network={fromNetwork} token={fromToken}
            onNetworkChange={setFromNetwork} onTokenChange={setFromToken}
            label={!sameToken && inputSide === 'send' ? 'Send as' : undefined}
          />
        </div>

        {(sameToken || inputSide === 'send') && (
          <>
            <div className="flex items-center gap-2">
              <AmountInput value={amount} onChange={setAmount} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(fromToken)} token={fromToken} />
              {fromToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{fromToken}</span>}
            </div>
            {amountUsd && <p className="text-[11px] text-base-content/20 mt-1">{amountUsd}</p>}
            {exceedsBalanceSend && <p className="text-[11px] text-error mt-1">Insufficient balance</p>}
          </>
        )}

        {!sameToken && inputSide === 'receive' && quoteLoading && <QuoteLoading />}

        <BalanceInfo
          balance={fromBalance} token={fromToken} prices={prices}
          exceeds={exceedsBalance || exceedsBalanceSend}
          showPresets={sameToken || inputSide === 'send'}
          onPresetClick={setAmount}
        />
      </div>

      {/* Swap section (different token) */}
      {!sameToken && (
        <>
          <ArrowDivider
            onClick={() => { setInputSide(s => s === 'receive' ? 'send' : 'receive'); setAmount(''); setQuote(null); }}
            flipped={inputSide === 'send'}
          />

          <div className={CARD}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <RecipientSelector value={recipient} onChange={setRecipient} />
                <span className={LABEL}>{inputSide === 'receive' ? 'receives' : (quoteLoading ? 'receives' : 'receives as')}</span>
              </div>
              <AssetSelector
                network={toNetwork} token={toToken}
                onNetworkChange={setToNetwork} onTokenChange={setToToken}
                label={inputSide === 'receive' ? 'Receives as' : undefined}
              />
            </div>

            {inputSide === 'receive' && (
              <>
                <div className="flex items-center gap-2">
                  <AmountInput value={amount} onChange={setAmount} className={`${INPUT_NUM} flex-1`} decimals={decimalsFor(toToken)} token={effectiveToToken} />
                  {toToken && <span className="text-base-content/30 text-sm font-medium shrink-0">{toToken}</span>}
                </div>

                {amountUsd && <p className="text-[11px] text-base-content/20 mt-1">{amountUsd}</p>}
                {exceedsBalanceSwap && <p className="text-[11px] text-error mt-1">Insufficient balance</p>}

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

            {inputSide === 'send' && quoteLoading && <QuoteLoading />}
          </div>
        </>
      )}

      {/* Swap options (same network, different token) */}
      {showSwapOptions && (
        <SwapOptionsSelector
          urgency={swapUrgency}
          preference={swapPreference}
          onUrgencyChange={setSwapUrgency}
          onPreferenceChange={setSwapPreference}
        />
      )}

      {/* Gas speed (Ethereum mainnet, same-token only) */}
      {showGasSelector && (
        <GasSpeedSelector
          selected={gasSpeed}
          onSelect={handleGasSelect}
          isNative={fromToken === 'ETH'}
          ethPrice={ethPrice}
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
