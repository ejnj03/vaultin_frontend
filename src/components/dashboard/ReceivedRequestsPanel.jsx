import { useState, useEffect } from 'react';
import { get_received_requests } from '../../utils/requests';
import { timeAgo } from '../../utils/formatting';
import { useUser } from '../../contexts/UserContext';
import { useApi } from '../../hooks/useApi';
import { NETWORK_LOGOS } from '../../utils/networkLogos';
import { displayAmount, fromBaseUnits, toUsd } from '../../utils/tokenUtils';
import { useCryptoData } from '../../contexts/CryptoDataContext';

const STATUS_BADGE = {
  pending: 'badge-warning',
  accepted: 'badge-success',
  declined: 'badge-error',
  canceled: 'badge-ghost',
};

export default function ReceivedRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useUser();
  const { data: cryptoData } = useCryptoData();
  const { apiCall } = useApi();
  const prices = cryptoData || {};

  useEffect(() => {
    if (!userData?.username) return;
    let done = false;
    get_received_requests(apiCall, userData?.username, (data) => {
      setRequests(data);
      if (!done) { done = true; setLoading(false); }
    }).then(() => { if (!done) setLoading(false); });
  }, [userData?.username]);

  const handleAccept = (req) => {
    console.log('accept', req.requestId);
  };

  const handleDecline = (req) => {
    console.log('decline', req.requestId);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-base-content/10 bg-base-100 flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-base-content/10 bg-base-100 p-6">
        <p className="text-sm text-base-content/40 text-center">No received requests.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-base-content/10 bg-base-100 divide-y divide-base-content/5 overflow-hidden">
      {requests.map((req) => {
        const ts = req.timestamp ? Math.floor(new Date(req.timestamp).getTime() / 1000) : null;
        const networkLogo = NETWORK_LOGOS[req.network];
        const isPending = req.status === 'pending';

        return (
          <div key={req.requestId} className="flex items-center gap-3 px-4 py-3.5 hover:bg-base-content/[0.02] transition-colors">
            {/* Network icon */}
            <div className="shrink-0">
              {networkLogo ? (
                <img src={networkLogo} className="w-8 h-8 rounded-full" alt={req.network} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-base-content/10 flex items-center justify-center text-xs font-bold text-base-content/40">
                  {req.network?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Title + requester */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{req.title || 'Payment request'}</p>
              <p className="text-xs text-base-content/40 truncate">
                From @{req.requesterUsername}
                {ts && <> &middot; {timeAgo(ts)}</>}
              </p>
            </div>

            {/* Amount + token */}
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{displayAmount(req.amount, req.token)} {req.token}</p>
              {(() => { const usd = toUsd(fromBaseUnits(req.amount, req.token), req.token, prices); return usd ? <p className="text-xs text-base-content/30">{usd}</p> : null; })()}
              {isPending ? (
                <div className="flex gap-2 mt-1 justify-end">
                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-semibold rounded-full bg-success/15 text-success hover:bg-success/25 transition-colors"
                    onClick={() => handleAccept(req)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-semibold rounded-full bg-base-content/5 text-base-content/50 hover:bg-error/15 hover:text-error transition-colors"
                    onClick={() => handleDecline(req)}
                  >
                    Deny
                  </button>
                </div>
              ) : (
                <span className={`badge badge-xs ${STATUS_BADGE[req.status] || 'badge-ghost'} capitalize`}>
                  {req.status}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
