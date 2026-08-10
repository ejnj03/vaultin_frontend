import { useState, useEffect } from 'react';
import { get_sent_requests } from '../../utils/requests';
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

export default function SentRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useUser();
  const { data: cryptoData } = useCryptoData();
  const { apiCall } = useApi();
  const prices = cryptoData || {};

  useEffect(() => {
    if (!userData?.username) return;
    let done = false;
    get_sent_requests(apiCall, userData?.username, (data) => {
      setRequests(data);
      if (!done) { done = true; setLoading(false); }
    }).then(() => { if (!done) setLoading(false); });
  }, [userData?.username]);

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
        <p className="text-sm text-base-content/40 text-center">No sent requests.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-base-content/10 bg-base-100 divide-y divide-base-content/5 overflow-hidden">
      {requests.map((req) => {
        const ts = req.timestamp ? Math.floor(new Date(req.timestamp).getTime() / 1000) : null;
        const networkLogo = NETWORK_LOGOS[req.network];

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

            {/* Title + recipient */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{req.title || 'Payment request'}</p>
              <p className="text-xs text-base-content/40 truncate">
                To @{req.recipientUsername}
                {ts && <> &middot; {timeAgo(ts)}</>}
              </p>
            </div>

            {/* Amount + token */}
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{displayAmount(req.amount, req.token)} {req.token}</p>
              {(() => { const usd = toUsd(fromBaseUnits(req.amount, req.token), req.token, prices); return usd ? <p className="text-xs text-base-content/30">{usd}</p> : null; })()}
              <span className={`badge badge-xs ${STATUS_BADGE[req.status] || 'badge-ghost'} capitalize`}>
                {req.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
