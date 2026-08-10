import { useState, useEffect, useRef, useMemo } from 'react';
import { minidenticon } from 'minidenticons';
import { search_profiles } from '../../../utils/profiles';
import { useUser } from '../../../contexts/UserContext';
import { truncateAddr } from '../../../utils/formatting';

export default function RecipientField({ value, onChange, placeholder }) {
  const [input, setInput] = useState(value || '');
  const [results, setResults] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const { contactProfiles } = useUser();

  const allFriendProfiles = useMemo(() => Object.values(contactProfiles), [contactProfiles]);
  const friendUsernames = useMemo(() => allFriendProfiles.map(p => p.username), [allFriendProfiles]);

  // Sync external value changes (e.g. reset from parent or URL params)
  useEffect(() => {
    if (!value && (input || selectedProfile)) {
      setInput('');
      setSelectedProfile(null);
      setResults([]);
    } else if (value && value !== input && !selectedProfile) {
      setInput(value);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const raw = query.startsWith('@') ? query.slice(1) : query;
    if (!raw || raw.length < 1 || !friendUsernames) {
      setResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      search_profiles(raw, (cached) => {
        const filtered = cached.filter(p => friendUsernames.includes(p.username));
        setResults(filtered);
        setSearching(false);
      });
    }, 150);
  };

  const handleInputChange = (val) => {
    setInput(val);
    onChange(val);
    setSelectedProfile(null);
    setResults([]);
    doSearch(val);
  };

  const handleSelect = (profile) => {
    //console.log(profile)
    //console.log(profile.username)
    setSelectedProfile(profile);
    setResults([]);
    setFocused(false);
    const account = profile.username;
    setInput(account);
    onChange(account);
  };

  const handleClear = () => {
    setSelectedProfile(null);
    setInput('');
    onChange('');
    setResults([]);
  };

  const showAllFriends = focused && !input && allFriendProfiles.length > 0;
  const showSearchResults = (results.length > 0 || searching) && input;
  const dropdownItems = showAllFriends ? allFriendProfiles : results;

  // Selected profile card
  if (selectedProfile) {
    return (
      <div className="flex items-center gap-3 bg-base-300/50 rounded-xl p-3">
        <div className="avatar shrink-0">
          <div className="w-9 rounded-full">
            {selectedProfile.avatar
              ? <img src={selectedProfile.avatar} alt={selectedProfile.username} />
              : <img src={`data:image/svg+xml;utf8,${encodeURIComponent(minidenticon(selectedProfile.username))}`} alt={selectedProfile.username} className="w-full h-full rounded-full" />
            }
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {selectedProfile.name && <p className="text-sm font-semibold truncate">{selectedProfile.name}</p>}
          <p className={`truncate ${selectedProfile.name ? 'text-xs text-base-content/40' : 'text-sm font-semibold'}`}>@{selectedProfile.username}</p>
          {selectedProfile.address && (
            <p className="text-[11px] text-base-content/40 truncate">{truncateAddr(selectedProfile.address)}</p>
          )}
        </div>
        <button type="button" className="btn btn-ghost btn-xs btn-circle" onClick={handleClear}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        placeholder={placeholder || '0x… or @username'}
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setFocused(true)}
        className="bg-transparent text-sm w-full outline-none placeholder:text-base-content/20 text-base-content"
      />

      {/* Dropdown: all friends on empty focus, search results on input */}
      {(showAllFriends || showSearchResults) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-base-200 rounded-xl border border-base-content/10 z-50 overflow-hidden max-h-48 overflow-y-auto" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          {showAllFriends && (
            <p className="text-[11px] text-base-content/30 px-3 pt-2 pb-1">Your contacts</p>
          )}
          {searching && results.length === 0 && (
            <div className="flex items-center justify-center py-3">
              <span className="loading loading-spinner loading-xs text-base-content/30" />
            </div>
          )}
          {dropdownItems.map((profile) => (
            <button
              key={profile.username}
              type="button"
              className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-base-content/5 transition-colors text-left"
              onClick={() => handleSelect(profile)}
            >
              <div className="avatar shrink-0">
                <div className="w-8 rounded-full">
                  {profile.avatar
                    ? <img src={profile.avatar} alt={profile.username} />
                    : <img src={`data:image/svg+xml;utf8,${encodeURIComponent(minidenticon(profile.username))}`} alt={profile.username} className="w-full h-full rounded-full" />
                  }
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {profile.name && <p className="text-sm font-medium truncate">{profile.name}</p>}
                <p className={`truncate ${profile.name ? 'text-xs text-base-content/40' : 'text-sm font-medium'}`}>@{profile.username}</p>
                {profile.address && (
                  <p className="text-[11px] text-base-content/40 truncate">{truncateAddr(profile.address)}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
