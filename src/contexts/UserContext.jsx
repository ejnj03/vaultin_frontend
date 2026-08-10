import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { get_friend_usernames, get_friends } from '../utils/friends';
import { get_contact_profiles } from '../utils/profiles';
import blockies from 'ethereum-blockies-base64';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userData, setUserDataState] = useState(() => {
    const stored = sessionStorage.getItem("vaultin_userdata");
    return stored ? JSON.parse(stored) : null;
  });
  //nested dict of wallet_address : { chainId : {ability: status}}
  const [walletCapabilities, setwalletCapabilities] = useState({})
  const [contactProfiles, setContactProfiles] = useState({})
  const [friends, setFriends] = useState([])
  const [friendsLoaded, setFriendsLoaded] = useState(false)
  const [userAddress, setUserAddress] = useState(null)

  const refreshFriends = useCallback(async (apiCall) => {
    if (!userData?.username) return;
    await get_friends(apiCall, userData.username, (data) => {
      setFriends(data);
      setFriendsLoaded(true);
    });
    setFriendsLoaded(true);
  }, [userData?.username]);

  const refreshContactProfiles = useCallback(async (apiCall) => {
    if (!userData?.username) return;
    const friendUsernames = await get_friend_usernames(userData.username);
    if (friendUsernames.length === 0) return;
    const profiles = await get_contact_profiles(apiCall, friendUsernames);
    setContactProfiles(profiles);
  }, [userData?.username]);

  const profileAvatar = useMemo(() =>
    userData?.profile_photo || (userAddress ? blockies(userAddress) : null),
    [userData?.profile_photo, userAddress]
  );

  function setUserData(data) {
    setUserDataState(data);
    if (data) {
      sessionStorage.setItem("vaultin_userdata", JSON.stringify(data));
    }
  }

  async function clearUser() {
    setUserDataState(null);
    setwalletCapabilities({})
    setContactProfiles({})
    setFriends([])
    setFriendsLoaded(false)
    setUserAddress(null)
    sessionStorage.removeItem("vaultin_userdata");
    const dbs = await indexedDB.databases();
    dbs.forEach(db => indexedDB.deleteDatabase(db.name));
  }

  const addWalletData = useCallback((wallet_address, wallet_data) => {
    setwalletCapabilities(prev => {
      console.log("wallet capabilities: ", wallet_data)
      const updated = {...prev}
      updated[wallet_address] = wallet_data
      return updated
    })
  }, [])

  function clearWalletData(wallet_address) {
    if (wallet_address in walletCapabilities) {
      setwalletCapabilities(prev => {
        const updated = {...prev}
        delete updated[wallet_address]
        return updated
      })
    }
  }

  return (
    <UserContext.Provider value={{ userData, setUserData, clearUser, profileAvatar, addWalletData, clearWalletData, walletCapabilities, contactProfiles, refreshContactProfiles, friends, friendsLoaded, refreshFriends, setUserAddress }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
