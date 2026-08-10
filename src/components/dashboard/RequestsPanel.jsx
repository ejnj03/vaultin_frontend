import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get_sent_requests, get_received_requests } from '../../utils/requests';
import { timeAgo } from '../../utils/formatting';
import { useUser } from '../../contexts/UserContext';
import { useApi } from '../../hooks/useApi';
import { NETWORK_LOGOS } from '../../utils/networkLogos';
import { displayAmount, fromBaseUnits, toUsdForBalance } from '../../utils/tokenUtils';
import { useCryptoData } from '../../contexts/CryptoDataContext';

const STATUS_COLORS = {
  pending: 'text-yellow-600 bg-yellow-500/[0.15] border-yellow-500/20',
  accepted: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  declined: 'text-error bg-error/10 border-error/20',
  canceled: 'text-base-content/40 bg-base-content/5 border-base-content/10',
};

export default function RequestsPanel({ filter = 'received' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingCancel, setConfirmingCancel] = useState(null);
  const { userData } = useUser();
  const { data: cryptoData } = useCryptoData();
  const { apiCall } = useApi();
  const navigate = useNavigate();
  const prices = cryptoData || {};
  const isSentFilter = filter === 'sent';

  useEffect(() => {
    if (!userData?.username) return;
    let done = false;
    const fetcher = isSentFilter ? get_sent_requests : get_received_requests;
    fetcher(apiCall, userData?.username, (data) => {
      setItems(data);
      if (!done) { done = true; setLoading(false); }
    }).then(() => { if (!done) setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [userData?.username, filter]);

  const handleAccept = (req) => {
    console.log('accept', req.requestId);
  };

  const handleDecline = (req) => {
    console.log('decline', req.requestId);
  };

  const handleCancel = (req) => {
    console.log('cancel', req.requestId);
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 pb-12 px-6">
          <div className="w-14 h-14 rounded-full bg-base-content/5 flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-7 h-7 text-base-content/20">
              {isSentFilter ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              )}
            </svg>
          </div>
          <p className="text-base font-medium text-base-content/50 mb-1">No {filter} requests</p>
          <p className="text-[13px] text-base-content/60 text-center max-w-xs mb-5">
            {isSentFilter
              ? 'Payment requests you send will show up here.'
              : 'When friends request payments from you, they\'ll appear here.'}
          </p>
          <button
            onClick={() => navigate('/contacts')}
            className="btn btn-ghost btn-sm text-primary/70 hover:text-primary hover:bg-primary/5 rounded-full px-4 font-medium"
          >
            {isSentFilter ? 'Request from a connection' : 'View connections'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((req) => {
            const ts = req.timestamp ? Math.floor(new Date(req.timestamp).getTime() / 1000) : null;
            const networkLogo = NETWORK_LOGOS[req.network];
            const isPending = req.status === 'pending';
            const otherUser = isSentFilter ? req.recipientUsername : req.requesterUsername;
            const usd = toUsdForBalance(fromBaseUnits(req.amount, req.token), req.token, prices);

            return (
              <div
                key={req.requestId}
                className={`rounded-lg border px-4 py-3.5 transition-colors ${
                  isPending
                    ? 'border-base-content/10 hover:bg-base-content/[0.02]'
                    : 'border-base-content/5'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Network icon */}
                  <div className="shrink-0 mt-0.5">
                    {networkLogo ? (
                      <img src={networkLogo} className="w-10 h-10 rounded-full" alt={req.network} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-base-content/10 flex items-center justify-center text-sm font-bold text-base-content/40">
                        {req.network?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-base-content truncate">{req.title || 'Payment request'}</p>
                        <p className="text-xs text-base-content/40 truncate">
                          {isSentFilter ? 'To' : 'From'} @{otherUser}
                          {ts && <> &middot; {timeAgo(ts)}</>}
                        </p>
                      </div>
                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-semibold text-base-content tabular-nums">{usd || `${displayAmount(req.amount, req.token)} ${req.token}`}</p>
                        {usd && <p className="text-[11px] text-base-content/35 tabular-nums">{displayAmount(req.amount, req.token)} {req.token}</p>}
                      </div>
                    </div>

                    {/* Actions / Status */}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${STATUS_COLORS[req.status] || STATUS_COLORS.canceled}`}>
                        {req.status}
                      </span>

                      {isPending && !isSentFilter && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="px-3.5 py-1 text-xs font-semibold rounded-full bg-success text-success-content hover:bg-success/80 transition-colors"
                            onClick={() => handleAccept(req)}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 text-xs text-base-content/40 hover:text-error transition-colors"
                            onClick={() => handleDecline(req)}
                          >
                            Deny
                          </button>
                        </div>
                      )}

                      {isPending && isSentFilter && (
                        confirmingCancel === req.requestId ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-base-content/40">Cancel request?</span>
                            <button
                              type="button"
                              className="text-xs font-medium text-red-400 border border-red-400/30 rounded-md px-2.5 py-0.5 hover:bg-red-400/10 transition-colors"
                              onClick={() => { handleCancel(req); setConfirmingCancel(null); }}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="text-xs text-base-content/50 hover:text-base-content/70 transition-colors"
                              onClick={() => setConfirmingCancel(null)}
                            >
                              Nevermind
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-red-400 border border-red-400/30 rounded-md px-3 py-1 hover:bg-red-400/10 transition-colors"
                            onClick={() => setConfirmingCancel(req.requestId)}
                          >
                            Cancel
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
