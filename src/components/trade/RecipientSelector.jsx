import { useState, useEffect, useRef } from 'react';
import { search_profiles, get_contact_profiles } from '../../utils/profiles';
import { get_friend_usernames } from '../../utils/friends';
import { useUser } from '../../contexts/UserContext';
import { useApi } from '../../hooks/useApi';

export default function RecipientSelector({ value, onChange }) {
  const { apiCall } = useApi();
  const [allFriendProfiles, setAllFriendProfiles] = useState([]);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const [friendUsernames, setFriendUsernames] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const { username } = useUser();

  // Load contacts on mount
  useEffect(() => {
    if (!username) return;
    (async () => {
      const names = await get_friend_usernames(username);
      setFriendUsernames(names);
      if (names.length > 0) {
        const profileMap = await get_contact_profiles(apiCall, names);
        setAllFriendProfiles(Object.values(profileMap));
      }
    })();
  }, [username]);

  // Sync external clears (e.g. handleClearAll)
  useEffect(() => {
    if (!value) {
      setSelectedProfile(null);
      setSearch('');
      setResults([]);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSearch = (val) => {
    setSearch(val);
    if (!val || !friendUsernames) {
      setResults([]);
      return;
    }
    search_profiles(val, (cached) => {
      setResults(cached.filter(p => friendUsernames.includes(p.username)));
    });
  };

  const handleSelect = (profile) => {
    setSelectedProfile(profile);
    setOpen(false);
    setSearch('');
    setResults([]);
    onChange(profile.username);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedProfile(null);
    setSearch('');
    setResults([]);
    onChange('');
  };

  const displayItems = search ? results : allFriendProfiles;

  return (
    <div className="relative inline-flex" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 group cursor-pointer"
      >
        {selectedProfile ? (
          <>
            <div className="avatar">
              <div className="w-4 h-4 rounded-full">
                {selectedProfile.profile_photo
                  ? <img src={selectedProfile.profile_photo} alt={selectedProfile.username} />
                  : <div className="w-full h-full bg-base-content/20 rounded-full" />
                }
              </div>
            </div>
            <span className="text-xs font-medium text-primary">{selectedProfile.username}</span>
            <span role="button" tabIndex={0} onClick={handleClear} onKeyDown={(e) => { if (e.key === 'Enter') handleClear(e); }} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <svg className="w-3 h-3 text-base-content/40 hover:text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </span>
          </>
        ) : (
          <>
            <span className="text-xs font-medium text-primary/70 group-hover:text-primary transition-colors">Recipient</span>
            <svg
              className={`w-3 h-3 text-primary/50 group-hover:text-primary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-base-200 rounded-xl border border-base-content/10 shadow-lg z-30 w-56 overflow-hidden">
          {/* Search */}
          <div className="px-3 pt-2.5 pb-1.5">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-base-300/50 text-xs w-full outline-none placeholder:text-base-content/20 text-base-content rounded-lg px-2.5 py-1.5"
            />
          </div>

          {/* List */}
          <div className="max-h-40 overflow-y-auto">
            {!search && allFriendProfiles.length > 0 && (
              <p className="text-[10px] text-base-content/30 px-3 pt-1 pb-0.5">Your contacts</p>
            )}
            {displayItems.length === 0 && (
              <p className="text-[11px] text-base-content/30 px-3 py-3 text-center">
                {search ? 'No results' : 'No contacts yet'}
              </p>
            )}
            {displayItems.map((profile) => (
              <button
                key={profile.username}
                type="button"
                className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-base-content/5 transition-colors text-left"
                onClick={() => handleSelect(profile)}
              >
                <div className="avatar shrink-0">
                  <div className="w-7 rounded-full">
                    {profile.profile_photo
                      ? <img src={profile.profile_photo} alt={profile.username} />
                      : <div className="w-full h-full bg-base-content/10 rounded-full" />
                    }
                  </div>
                </div>
                <span className="text-xs font-medium truncate">{profile.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
