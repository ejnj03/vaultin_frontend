import { useState, useRef } from 'react';
import { profile_from_username, profile_from_address } from '../../utils/profiles';
import { useUser } from '../../contexts/UserContext';
import { useAccount } from 'wagmi';
import { useApi } from '../../hooks/useApi';
import { minidenticon } from 'minidenticons';
import PillTabs from '../layout/PillTabs';

export default function AddFriendModal({ open, onClose, onRequested }) {
  const { apiCall } = useApi();
  const [activeTab, setActiveTab] = useState('username');
  const [usernameInput, setUsernameInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [error, setError] = useState('')
  const [requested, setRequested] = useState(false)
  const [usernameResult, setUsernameResult] = useState(null)
  const [addressResult, setAddressResult] = useState(null)
  const [searched, setSearched] = useState(false)
  const { userData } = useUser()
  const { address } = useAccount()
  const mouseDownOnBackdrop = useRef(false)

  const activeResult = activeTab === 'username' ? usernameResult : addressResult
  const setActiveResult = activeTab === 'username' ? setUsernameResult : setAddressResult
  const hasInput = activeTab === 'username' ? usernameInput.trim() : addressInput.trim();

  const handleSendRequest = async () => {
    setError('')
    try {
      const res = await apiCall('friends/send-friend-request', { method: 'POST', body: { username: activeResult.username }, ret_error: true, service: 'payments' })
      if ("error" in res) {
        setError(res.error)
      } else {
        setRequested(true)
        onRequested?.()
      }
    } catch (err) {
      setError('Failed to send friend request')
    }
  }

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    const val = usernameInput.trim()
    setError('')
    setRequested(false)
    setUsernameResult(null)
    setSearched(true)

    if (val == userData?.username) {
      setError("Cannot add self as a friend")
      return
    }
    try {
      let found = false
      await profile_from_username(apiCall, val, (profile) => {
        setUsernameResult(profile)
        found = true
      })
      if (!found) setError("No users to display")
    } catch (error) {
      setError("No users to display")
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setError('')
    setRequested(false)
    setAddressResult(null)
    setSearched(true)
    const val = addressInput.trim()
    if (val == address) {
      setError("Cannot add self as a friend")
      return
    }
    try {
      let found = false
      await profile_from_address(apiCall, val, (profile) => {
        setAddressResult(profile)
        found = true
      })
      if (!found) setError("No users to display")
    } catch (error) {
      setError("No users to display")
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={(e) => { mouseDownOnBackdrop.current = e.target === e.currentTarget }}
      onMouseUp={(e) => { if (mouseDownOnBackdrop.current && e.target === e.currentTarget) onClose(); mouseDownOnBackdrop.current = false }}
    >
      <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-md mx-4 relative flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <h2 className="text-sm font-bold">Add Friend</h2>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 mt-3">
          <PillTabs
            tabs={[{ key: 'username', label: 'Username' }, { key: 'address', label: 'Address' }]}
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); setSearched(false); setError(''); }}
          />
        </div>

        {/* Search input */}
        <div className="px-6 pt-5 pb-4">
          {activeTab === 'username' ? (
            <form onSubmit={handleUsernameSubmit}>
              <div className="flex items-center gap-0 rounded-lg border border-base-content/10 focus-within:border-primary/40 transition-colors overflow-hidden">
                <span className="pl-3 pr-1 text-sm text-base-content/40 select-none bg-transparent">@</span>
                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm py-2.5 pr-2 outline-none placeholder:text-base-content/25"
                  placeholder="username"
                  value={usernameInput}
                  onChange={(e) => { setUsernameInput(e.target.value); setSearched(false); }}
                />
                <button
                  type="submit"
                  className={`px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
                    hasInput
                      ? 'bg-primary text-primary-content hover:bg-primary/80'
                      : 'bg-base-content/5 text-base-content/25 cursor-not-allowed'
                  }`}
                  disabled={!hasInput}
                >
                  Search
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddressSubmit}>
              <div className="flex items-center gap-0 rounded-lg border border-base-content/10 focus-within:border-primary/40 transition-colors overflow-hidden">
                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm py-2.5 pl-3 pr-2 outline-none placeholder:text-base-content/25"
                  placeholder="0x... wallet address"
                  value={addressInput}
                  onChange={(e) => { setAddressInput(e.target.value); setSearched(false); }}
                />
                <button
                  type="submit"
                  className={`px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
                    hasInput
                      ? 'bg-primary text-primary-content hover:bg-primary/80'
                      : 'bg-base-content/5 text-base-content/25 cursor-not-allowed'
                  }`}
                  disabled={!hasInput}
                >
                  Search
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Result area */}
        <div className="px-6 pb-6 min-h-[120px]">
          {activeResult ? (
            <div className="flex items-center gap-3.5 bg-base-content/[0.03] border border-base-content/[0.06] rounded-lg p-4">
              <div className="avatar shrink-0">
                <div className="w-10 rounded-full">
                  <img
                    src={activeResult.profile_photo || `data:image/svg+xml;utf8,${encodeURIComponent(minidenticon(activeResult.username))}`}
                    alt={activeResult.username}
                    className="w-10 h-10 rounded-full"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">@{activeResult.username}</p>
                <p className="text-[11px] text-base-content/35 truncate font-mono">{activeResult.address}</p>
              </div>
              <button
                className={`btn btn-sm rounded-full px-4 font-semibold ${requested ? 'btn-disabled' : 'btn-primary'}`}
                onClick={handleSendRequest}
                disabled={requested}
              >
                {requested ? 'Sent' : 'Request'}
              </button>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[100px]">
              <p className="text-sm text-error">{error}</p>
            </div>
          ) : searched ? (
            <div className="flex items-center justify-center h-[100px]">
              <span className="loading loading-spinner loading-sm text-primary" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[100px] border border-dashed border-base-content/10 rounded-lg">
              <p className="text-[13px] text-base-content/25">Results will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
