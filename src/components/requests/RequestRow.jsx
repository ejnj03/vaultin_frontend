import { timeAgoLong } from '../../utils/formatting';
import { useState, useEffect } from 'react';
import { accept_request, decline_request, cancel_request } from '../../utils/friends';
import { useApi } from '../../hooks/useApi';
import { minidenticon } from 'minidenticons';

const STATUS_COLORS = {
  pending: 'text-base-content/50 bg-base-content/5 border-base-content/10',
  accepted: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  rejected: 'text-base-content/40 bg-base-content/5 border-base-content/10',
  canceled: 'text-base-content/40 bg-base-content/5 border-base-content/10',
};

export default function RequestRow({ request, user, friendProfile, type }) {
  const otherUsername = type === 'received' ? request.requesterUsername : request.recieverUsername;
  const profilePhoto = friendProfile?.profile_photo;
  const identiconSvg = minidenticon(otherUsername);
  const identiconUrl = `data:image/svg+xml;utf8,${encodeURIComponent(identiconSvg)}`;
  const [status, setStatus] = useState(request.status || 'pending')
  const [error, setError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const { apiCall } = useApi();

  useEffect(() => {
    setStatus(request.status || 'pending')
  }, [request.status])

  const handleAccept = async () => {
    setError('')
    try {
      const res = await accept_request(apiCall, request, user)
      if ("error" in res) {
        setError(res.error)
      } else {
        setStatus("accepted")
      }
    } catch (err) {
      setError('Failed to accept request')
    }
  };

  const handleDecline = async () => {
    setError('')
    try {
      const res = await decline_request(apiCall, request, user)
      if ("error" in res) {
        setError(res.error)
      } else {
        setStatus("rejected")
      }
    } catch (err) {
      setError('Failed to decline request')
    }
  };

  const handleCancel = async () => {
    setError('')
    try {
      const res = await cancel_request(apiCall, request, user)
      if ("error" in res) {
        setError(res.error)
      } else {
        setStatus("canceled")
      }
    } catch (err) {
      setError('Failed to cancel request')
    }
    setConfirmCancel(false)
  };

  const handleResend = async () => {
    setError('')
    try {
      const res = await apiCall('friends/send-friend-request', { method: 'POST', body: { username: otherUsername }, ret_error: true, service: 'payments' })
      if ("error" in res) {
        setError(res.error)
      } else {
        setStatus("pending")
      }
    } catch (err) {
      setError('Failed to send request')
    }
  };

  if (request.status === 'canceled') return null;

  const statusLabel = status === 'rejected' ? 'Ignored' : status;

  return (
    <>
      <div className="flex items-center gap-3.5 py-3">
        <div className="avatar shrink-0">
          <div className="w-10 rounded-full">
            <img
              src={profilePhoto || identiconUrl}
              alt={otherUsername}
              className="w-10 h-10 rounded-full"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-base-content truncate">@{otherUsername}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_COLORS[status] || STATUS_COLORS.canceled}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-[11px] text-base-content/35 mt-0.5">
            {type === 'received' ? 'Wants to connect' : 'Request sent'}
            {' · '}
            {timeAgoLong(request.createdAt)}
          </p>
          {error && (
            <p className="text-xs text-error mt-1">{error}</p>
          )}
        </div>

        {/* Received — pending */}
        {type === 'received' && status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0">
            <button className="text-xs text-base-content/40 hover:text-base-content/60 transition-colors" onClick={handleDecline}>
              Ignore
            </button>
            <button className="btn btn-primary btn-sm font-semibold rounded-full px-5" onClick={handleAccept}>
              Accept
            </button>
          </div>
        )}

        {/* Sent — pending */}
        {type === 'sent' && status === 'pending' && !confirmCancel && (
          <button
            className="text-xs text-red-400 border border-red-400/30 rounded-md px-3 py-1 hover:bg-red-400/10 transition-colors shrink-0"
            onClick={() => setConfirmCancel(true)}
          >
            Cancel
          </button>
        )}

        {/* Sent — pending: inline confirmation */}
        {type === 'sent' && status === 'pending' && confirmCancel && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="text-xs font-medium text-red-400 border border-red-400/30 rounded-md px-2.5 py-0.5 hover:bg-red-400/10 transition-colors"
              onClick={handleCancel}
            >
              Confirm
            </button>
            <button
              className="text-xs text-base-content/50 hover:text-base-content/70 transition-colors"
              onClick={() => setConfirmCancel(false)}
            >
              Nevermind
            </button>
          </div>
        )}

        {/* Sent — canceled: re-request */}
        {type === 'sent' && status === 'canceled' && (
          <button className="btn btn-outline btn-primary btn-sm font-semibold rounded-full px-5 shrink-0" onClick={handleResend}>
            Resend
          </button>
        )}
      </div>
    </>
  );
}
