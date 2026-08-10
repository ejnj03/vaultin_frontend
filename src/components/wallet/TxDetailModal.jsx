import TokenIcon from './TokenIcon';
import { fmtAmountFull, formatFullDate, fmtGasEth, fmtUsd, truncateAddr } from '../../utils/formatting';
import { useAccount } from 'wagmi';
import { useUser } from '../../contexts/UserContext';

const STATUS_STYLES = {
  confirmed: 'badge-success',
  submitted: 'badge-warning',
  failed: 'badge-error',
};

function ProfileCell({ label, address, profile, isSelf, selfUsername, selfPhoto }) {
  const isMe = isSelf;
  const photo = isMe ? selfPhoto : profile?.avatar;
  const displayName = isMe ? 'You' : profile?.name;
  const username = isMe ? selfUsername : profile?.username;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-base-content/40">{label}</span>
      <div className="flex items-center gap-2">
        {photo ? (
          <img src={photo} alt="" className="w-5 h-5 rounded-full object-cover" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-base-content/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-base-content/30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}
        <div className="text-right">
          {(displayName || username) ? (
            <>
              {displayName && <p className="text-sm font-medium">{displayName}</p>}
              {username && <p className={`text-xs ${displayName ? 'text-base-content/40' : 'text-sm font-medium'}`}>@{username}</p>}
              <p className="text-xs text-base-content/30">{truncateAddr(address)}</p>
            </>
          ) : (
            <p className="text-sm font-medium">{truncateAddr(address)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TxDetailModal({ tx, gasFees, tokenLogos, priceMap, contactProfiles = {}, onClose }) {
  const { address } = useAccount();
  const { userData, profileAvatar } = useUser();

  const isSent = tx.direction === 'sent';
  const isSwap = tx.direction === 'swapped';
  const label = isSwap ? 'Swapped' : isSent ? 'Sent' : 'Received';

  const dirColor = isSwap ? 'bg-info/10' : isSent ? 'bg-error/10' : 'bg-success/10';
  const iconColor = isSwap ? 'text-info' : isSent ? 'text-error' : 'text-success';
  const statusColor = tx.status === 'confirmed' ? 'text-success' : tx.status === 'failed' ? 'text-error' : 'text-warning';

  const gas = gasFees[tx.hash];
  const ethPrice = priceMap['eth']?.usd || 0;
  const gasUsd = gas && ethPrice ? gas * ethPrice : null;

  const tokenPrice = priceMap[tx.asset?.toLowerCase()]?.usd;
  const usdValue = tx.value != null && tokenPrice ? tx.value * tokenPrice : null;

  const EXPLORERS = {
    ethereum: 'https://etherscan.io/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    base:     'https://basescan.org/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
    polygon:  'https://polygonscan.com/tx/',
  };
  const explorer = EXPLORERS[tx.network] ?? EXPLORERS.ethereum;
  const etherscanUrl = tx.hash ? `${explorer}${tx.hash}` : null;

  console.log("[TxDetailModal] contactProfiles:", contactProfiles);
  const fromProfile = tx.from ? contactProfiles[tx.from.toLowerCase()] : null;
  const toProfile = tx.to ? contactProfiles[tx.to.toLowerCase()] : null;
  console.log("[TxDetailModal] fromProfile:", fromProfile, "toProfile:", toProfile);
  const isFromSelf = address && tx.from?.toLowerCase() === address.toLowerCase();
  const isToSelf = address && tx.to?.toLowerCase() === address.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${dirColor}`}>
              {isSwap ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 ${iconColor}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              ) : isSent ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 ${iconColor}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 ${iconColor}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25M4.5 19.5V8.25" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className={`text-xs ${statusColor} flex items-center gap-1`}>
                {tx.status === 'confirmed' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
                {formatFullDate(tx.metadata.blockTimestamp)}
              </p>
            </div>
          </div>
        </div>

        {/* Hero amount */}
        <div className="flex flex-col items-center py-5 px-5">
          {isSwap ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <TokenIcon symbol={tx.fromAsset} tokenLogos={tokenLogos} priceMap={priceMap} network="ethereum" />
                <p className="text-2xl font-bold">{fmtAmountFull(tx.fromValue)} {tx.fromAsset}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-base-content/30 my-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
              <div className="flex items-center gap-2">
                <TokenIcon symbol={tx.toAsset} tokenLogos={tokenLogos} priceMap={priceMap} network="ethereum" />
                <p className="text-2xl font-bold">{fmtAmountFull(tx.toValue)} {tx.toAsset}</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold mb-1">
                {fmtAmountFull(tx.value)} {tx.asset}
              </p>
              <div className="flex items-center gap-1.5">
                <TokenIcon symbol={tx.asset} tokenLogos={tokenLogos} priceMap={priceMap} network="ethereum" />
                <span className="text-sm text-base-content/50">
                  {usdValue != null ? fmtUsd(usdValue) : '—'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Details table */}
        <div className="border-t border-base-content/5 mx-5" />
        <div className="px-5 py-4 space-y-3">
          {tx.title && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-content/40">Title</span>
              <span className="text-sm font-medium">{tx.title}</span>
            </div>
          )}

          <ProfileCell label="From" address={tx.from} profile={fromProfile} isSelf={isFromSelf} selfUsername={userData?.username} selfPhoto={profileAvatar} />
          <ProfileCell label="To" address={tx.to} profile={toProfile} isSelf={isToSelf} selfUsername={userData?.username} selfPhoto={profileAvatar} />

          {gas != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-content/40">Network cost</span>
              <span className="text-sm font-medium">
                {fmtGasEth(gas)}
                {gasUsd != null && (
                  <span className="text-base-content/40 ml-1">({fmtUsd(gasUsd)})</span>
                )}
              </span>
            </div>
          )}

          {tx.hash && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-content/40">Transaction</span>
              <span className="text-sm font-medium flex items-center gap-1">
                {truncateAddr(tx.hash)}
                {etherscanUrl && (
                  <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                )}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content/40">Submitted on</span>
            <span className="text-sm font-medium">{formatFullDate(tx.metadata.blockTimestamp)}</span>
          </div>

          {tx.status !== 'confirmed' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-content/40">Status</span>
              <span className={`badge badge-sm ${STATUS_STYLES[tx.status] || 'badge-ghost'}`}>
                {tx.status}
              </span>
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn btn-ghost btn-block rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}
