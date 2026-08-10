import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/contacts/SearchBar';
import ContactRow from '../components/contacts/ContactRow';
import { get_friends } from '../utils/friends';
import { profile_from_username } from '../utils/profiles';
import { useUser } from '../contexts/UserContext';
import { useApi } from '../hooks/useApi';

function CopyUsername({ username }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`@${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [username]);

  return (
    <div className="mx-4 mt-4 bg-primary/10 border border-primary/20 rounded-xl p-4">
      <p className="text-xs text-base-content/40 uppercase tracking-wide mb-1">Your username</p>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-base-content">@{username}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-sm text-base-content/40 hover:text-base-content transition-colors"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-success">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
            </svg>
          )}
          <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [friends, setFriends] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { userData } = useUser()
  const { apiCall } = useApi()
  const navigate = useNavigate()

  useEffect(() => {
    let done = false
    get_friends(apiCall, userData?.username, (data) => {
      setFriends(data)
      if (!done) { done = true; setLoading(false) }
    }).then(() => { if (!done) setLoading(false) })
  }, [])

  useEffect(() => {
    friends.forEach(f => {
      if (!(f.friendUser in profiles)) {
        profile_from_username(apiCall, f.friendUser, (profile) => {
          setProfiles(prev => ({ ...prev, [f.friendUser]: profile }))
        })
      }
    })
  }, [friends])

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto bg-base-200 rounded-box border border-base-content/5 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-base-content/5 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium">Connections</p>
            {!loading && (
              <span className="text-[11px] text-base-content/30">{friends.length} contact{friends.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Username share CTA — persistent, prominent */}
        <CopyUsername username={userData?.username} />

        {/* Search */}
        {friends.length > 0 && (
          <div className="px-4 py-3 border-b border-base-content/5 shrink-0">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : friends.length > 0 ? (() => {
            const q = search.toLowerCase()
            const filtered = q ? friends.filter(f => f.friendUser.toLowerCase().includes(q)) : friends
            return filtered.length > 0 ? (
              <div className="p-3 space-y-1.5">
                {filtered.map(f => (
                  <ContactRow
                    key={f.friendUser}
                    contact={f}
                    profile={profiles[f.friendUser]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-base-content/40">No matching connections.</p>
              </div>
            )
          })() : (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 rounded-full bg-base-content/5 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-7 h-7 text-base-content/20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <p className="text-base font-medium text-base-content/50 mb-1">No connections yet</p>
              <p className="text-[13px] text-base-content/35 mb-5">Share your username above or send a friend request to get started.</p>
              <button
                onClick={() => navigate('/requests')}
                className="btn btn-ghost btn-sm text-primary/70 hover:text-primary hover:bg-primary/5 rounded-full px-4 font-medium"
              >
                Send a friend request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
