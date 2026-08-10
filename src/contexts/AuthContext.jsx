import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccount, useSignMessage, useCapabilities } from 'wagmi';
import { login as siweLogin, logout as siweLogout, check_registered } from '../utils/useAuth';
import { get_res } from '../utils/api_utils';
import { useUser } from './UserContext';

const AuthContext = createContext(null);
let refreshPromise = null;
let loginPromise = null;

export function AuthProvider({ children }) {
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const { setUserData, clearUser, addWalletData, clearWalletData } = useUser();
  const capabilities = useCapabilities();
  const [authStep, _setAuthStep] = useState(null); // "wallet" | "loading" | "registry" | null
  const setAuthStep = (step) => { console.log("[auth] authStep:", authStep, "→", step); _setAuthStep(step); };
  //const checking = authStep !== null;
  //console.log("[auth] checking:", checking, "authStep:", authStep);
  //in the process of obtaining refresh token
  const [refreshing, setRefreshing] = useState(false)
  const [accessToken, setaccessToken] = useState(null)

  //once available (wallet is connected) add wallet capabilities (capabilities.data is async)
  useEffect(() => {
    if (capabilities.data && address) {
        addWalletData(address, capabilities.data)
    }
  }, [capabilities.data, address])

  const login = useCallback(async () => {
    // add wallet data 
    //if (capabilities.data) addWalletData(address, capabilities.data)
    //getting and setting the access token
    let access_token = null
    try {
      if (loginPromise) return loginPromise;
      setAuthStep("wallet");
      setRefreshing(true);
      //clearUser();
      loginPromise = siweLogin(address, signMessageAsync);
      const data = await loginPromise
      setAuthStep("loading");
      access_token = data.access_token
      console.log("[auth] setAccessToken:", access_token)
      setaccessToken(access_token)
      setRefreshing(false)
      loginPromise = null
      sessionStorage.setItem("siwe_logged_in", address);
      setAuthStep("registry");
      const fetchedUserData = await check_registered();
      console.log("fetched user data: ", fetchedUserData)
      setUserData(fetchedUserData);
    } finally {
      setAuthStep(null);
    }
    return access_token
  }, [address, signMessageAsync, setUserData, clearUser]);

  const getaccessToken = useCallback(async () => {
    if (refreshPromise) return refreshPromise;
    setRefreshing(true)
    try {
      refreshPromise = get_res('auth/update_access', {method: "POST", ret_error: true})
      const data = await refreshPromise
      refreshPromise = null
      if ("error_code" in data && data["error_code"] == "ExpiredSignatureError") {
        return null
      }
      const access_token = data["access_token"]
      //console.log(access_token)
      console.log("[auth] setAccessToken:", access_token)
      setaccessToken(access_token)
      return access_token
    } catch (err) {
      //console.error("Failed to refresh access token:", err)
      refreshPromise = null
      return null
    } finally {
      setRefreshing(false)
    }
  }, [address, accessToken])

  useEffect(() => {
    async function init() {
      let token = null
      token = await getaccessToken()
      if (!token && sessionStorage.getItem("siwe_logged_in")) {
        token = await login()
      }
    }
    init()
  }, [])

  const logout = useCallback(async () => {
    await siweLogout();
    sessionStorage.removeItem("siwe_logged_in");
    clearUser();
  }, [clearUser]);

  return (
    <AuthContext.Provider value={{ login, logout, authStep, accessToken, getaccessToken, refreshing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
