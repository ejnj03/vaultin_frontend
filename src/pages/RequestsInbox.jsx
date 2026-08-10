import { useState, useEffect } from 'react';
import AddFriendModal from '../components/requests/AddFriendModal';
import RequestRow from '../components/requests/RequestRow';
import { profile_from_username } from '../utils/profiles';
import { get_sent_requests, get_received_requests } from '../utils/friends';
import { useUser } from '../contexts/UserContext';
import { useApi } from '../hooks/useApi';
import PillTabs from '../components/layout/PillTabs';

export default function RequestsInbox() {
  const { apiCall } = useApi();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  const [recieved, setRecieved] = useState([])
  const [sent, setSent] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const { userData } = useUser()

  useEffect(() => {
    let done = false
    get_received_requests(apiCall, userData?.username, (data) => {
      setRecieved(data)
      if (!done) { done = true; setLoading(false) }
    }).then(() => { if (!done) setLoading(false) })
  }, []);

  useEffect(() => {
    get_sent_requests(apiCall, userData?.username, (data) => {
      setSent(data)
    })
  }, []);

  useEffect(() => {
    sent.forEach(r => {
      const reciever = r.recieverUsername
      if (!(reciever in profiles)) {
        profile_from_username(apiCall, reciever, (profile) => {
          setProfiles(prev => ({ ...prev, [reciever]: profile}))
      })
      }
    })
  }, [sent])

  useEffect(() => {
    recieved.forEach(s => {
      const sender = s.requesterUsername
      if (!(sender in profiles)) {
        profile_from_username(apiCall, sender, (profile) => {
          setProfiles(prev => ({ ...prev, [sender]: profile}))
      })
      }
    })
  }, [recieved])

  const pendingReceivedCount = recieved.filter(r => r.status === 'pending').length;
  const pendingSentCount = sent.filter(r => r.status !== 'canceled').length;

  const badgeClass = (count, isActive) => {
    if (isActive && count > 0) return 'text-base-100/60 bg-base-100/10 border-transparent';
    if (count > 0) return 'text-base-content/40 bg-base-content/10 border-transparent';
    return 'text-base-content/50 bg-base-content/5 border-transparent';
  };

  const TABS = [
    {
      key: 'received',
      label: 'Received',
      render: (isActive) => (
        <>
          Received
          {!loading && pendingReceivedCount > 0 && (
            <span className={`ml-1.5 text-[11px] font-semibold px-1.5 py-px rounded-[10px] ${badgeClass(pendingReceivedCount, isActive)}`}>
              {pendingReceivedCount}
            </span>
          )}
        </>
      ),
    },
    {
      key: 'sent',
      label: 'Sent',
      render: (isActive) => (
        <>
          Sent
          {!loading && pendingSentCount > 0 && (
            <span className={`ml-1.5 text-[11px] font-semibold px-1.5 py-px rounded-[10px] ${badgeClass(pendingSentCount, isActive)}`}>
              {pendingSentCount}
            </span>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto bg-base-200 rounded-box border border-base-content/[0.06] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-base-content/5 pb-4 mb-2 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium">Friend Requests</p>
            <button
              className="btn btn-primary btn-sm rounded-full px-4 font-semibold"
              onClick={() => setShowAddFriend(true)}
            >
              Add Friend
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-4 py-3">
          <PillTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        <div className="overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : activeTab === 'received' ? (
            recieved.length > 0 ? (
              <div className="p-3 space-y-1.5">
                {recieved.map(r => (
                  <RequestRow
                    key={r.requesterUsername}
                    request={r}
                    user={userData?.username}
                    friendProfile={profiles[r.requesterUsername]}
                    type="received"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-20 pb-12 px-6">
                <div className="w-14 h-14 rounded-full bg-base-content/[0.08] flex items-center justify-center mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-7 h-7 text-base-content/50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <p className="text-base font-medium text-base-content/50 mb-1">No received requests</p>
                <p className="text-[13px] text-base-content/60 text-center max-w-xs">When someone sends you a friend request, it will appear here.</p>
              </div>
            )
          ) : (
            sent.length > 0 ? (
              <div className="p-3 space-y-1.5">
                {sent.map(r => (
                  <RequestRow
                    key={r.recieverUsername}
                    request={r}
                    user={userData?.username}
                    friendProfile={profiles[r.recieverUsername]}
                    type="sent"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-20 pb-12 px-6">
                <div className="w-14 h-14 rounded-full bg-base-content/5 flex items-center justify-center mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-7 h-7 text-base-content/20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </div>
                <p className="text-base font-medium text-base-content/50 mb-1">No sent requests</p>
                <p className="text-[13px] text-base-content/60 text-center max-w-xs">Friend requests you send will appear here.</p>
              </div>
            )
          )}
        </div>
      </div>

      <AddFriendModal
        open={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onRequested={() => get_sent_requests(apiCall, userData?.username, setSent)}
      />
    </div>
  );
}
