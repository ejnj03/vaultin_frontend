import { useState } from 'react';
import AssetSelector from './AssetSelector';
import RecipientField from './RecipientField';
import AmountInput from './AmountInput';
import ConfirmClearDialog from './ConfirmClearDialog';
import { create_request } from '../../utils/requests';
import { useApi } from '../../hooks/useApi';
import { useCryptoData } from '../../contexts/CryptoDataContext';
import { decimalsFor, toBaseUnits, fromBaseUnits, displayAmount, toUsd, fromUsd, DOLLAR_PRESETS } from '../../utils/tokenUtils';
import { CARD, INPUT_NUM, INPUT_TEXT, LABEL, BTN } from './tradeStyles';

export default function RequestPanel() {
  const [requestTitle, setrequestTitle] = useState('');
  const [requestTo, setrequestTo] = useState('');
  const [toAmount, settoAmount] = useState('');
  const [toNetwork, settoNetwork] = useState('');
  const [toToken, settoToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { apiCall } = useApi();
  const { data: cryptoData } = useCryptoData();
  const prices = cryptoData || {};
  const amountUsd = toAmount ? toUsd(fromBaseUnits(toAmount, toToken), toToken, prices) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      console.log("requestTo: ", requestTo)
      const res = await create_request(apiCall, {
        title: requestTitle,
        recipientUsername: requestTo,
        amount: toAmount,
        network: toNetwork,
        token: toToken,
      });
      if (!("error" in res)) {
        setCreatedRequest(res);
        setrequestTitle('');
        setrequestTo('');
        settoAmount('');
        settoNetwork('');
        settoToken('');
      }
    } catch (err) {
      console.error("request failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearAll = () => {
    setrequestTitle('');
    setrequestTo('');
    settoAmount('');
    settoNetwork('');
    settoToken('');
    setShowClearConfirm(false);
  };

  const isDirty = requestTitle || requestTo || toAmount || toNetwork || toToken;

  const canSubmit = !submitting && requestTitle && requestTo && toAmount && toNetwork && toToken;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-1">
        {/* Reason */}
        <div className={CARD}>
          <span className={LABEL}>Reason</span>
          <input
            type="text" placeholder="What's this for?"
            value={requestTitle} onChange={(e) => setrequestTitle(e.target.value)}
            className={`${INPUT_TEXT} mt-2`}
          />
        </div>

        {/* Amount & token */}
        <div className={CARD}>
          <div className="flex items-center justify-between mb-3">
            <span className={LABEL}>Amount</span>
            <AssetSelector
              network={toNetwork} token={toToken}
              onNetworkChange={settoNetwork} onTokenChange={settoToken}
            />
          </div>
          <AmountInput value={toAmount} onChange={settoAmount} className={INPUT_NUM} decimals={decimalsFor(toToken)} token={toToken} />
          {amountUsd && <p className="text-[11px] text-base-content/20 mt-1">{amountUsd}</p>}

          {toToken && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {DOLLAR_PRESETS.map(usd => {
                const tokenAmount = fromUsd(usd, toToken, prices);
                return (
                  <button key={usd} type="button" className="text-[10px] text-primary/70 hover:text-primary bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-full transition-colors"
                    onClick={() => {
                      if (!tokenAmount) return;
                      const currentBase = toAmount || '0';
                      const addBase = toBaseUnits(tokenAmount, toToken);
                      const sum = (BigInt(currentBase) + BigInt(addBase)).toString();
                      settoAmount(sum);
                    }}>
                    +${usd}
                  </button>
                );
              })}
              {toAmount && (
                <button type="button" className="text-[10px] text-error/70 hover:text-error bg-error/5 hover:bg-error/10 px-2 py-0.5 rounded-full transition-colors"
                  onClick={() => settoAmount('')}>
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Request from */}
        <div className={CARD}>
          <span className={`${LABEL} mb-2 block`}>From</span>
          <RecipientField value={requestTo} onChange={setrequestTo} />
        </div>

        <button type="submit" className={BTN} disabled={!canSubmit}>
          {submitting ? <span className="loading loading-spinner loading-sm" /> : !requestTo ? 'Enter recipient' : !toAmount ? 'Enter an amount' : 'Request'}
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

      {/* Success modal */}
      {createdRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCreatedRequest(null)}>
          <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center pt-6 pb-4 px-5">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-success">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-base font-bold mb-1">Request Created</p>
              <p className="text-sm text-base-content/50">Your payment request has been sent.</p>
            </div>

            <div className="border-t border-base-content/5 mx-5" />
            <div className="px-5 py-4 space-y-2.5">
              {createdRequest.title && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-base-content/40">Reason</span>
                  <span className="text-sm font-medium">{createdRequest.title}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/40">Amount</span>
                <span className="text-sm font-medium">{displayAmount(createdRequest.amount, createdRequest.token)} {createdRequest.token}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/40">Network</span>
                <span className="text-sm font-medium capitalize">{createdRequest.network}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/40">From</span>
                <span className="text-sm font-medium">@{createdRequest.recipientUsername}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/40">Status</span>
                <span className="badge badge-sm badge-warning">{createdRequest.status}</span>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button onClick={() => setCreatedRequest(null)} className="btn btn-primary btn-block rounded-xl text-sm font-semibold">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
