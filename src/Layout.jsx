import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useAccountEffect } from 'wagmi';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Logo from './components/layout/Logo';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import VaultAuthLoading from './components/layout/VaultAuthLoading';
import VaultLogoutTransition from './components/layout/VaultLogoutTransition';
import { useUser } from './contexts/UserContext';
import { useAuth } from './contexts/AuthContext';
import { useApi } from './hooks/useApi';

export function Layout() {
  const { address, isConnected, isReconnecting } = useAccount();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData, refreshContactProfiles, refreshFriends, setUserAddress } = useUser();
  const { login, logout, authStep, accessToken } = useAuth();
  const { apiCall } = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const apiCallRef = useRef(apiCall);
  apiCallRef.current = apiCall;

  // Tracks whether the exit transition is still playing
  const [transitioning, setTransitioning] = useState(false);

  // When auth completes (authStep goes null), start the exit transition
  const wasChecking = useRef(false);
  useEffect(() => {
    if (wasChecking.current && !authStep) {
      setTransitioning(true);
    }
    wasChecking.current = !!authStep;
  }, [authStep]);

  const handleTransitionDone = useCallback(() => {
    setTransitioning(false);
  }, []);

  // Logout transition state
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutAddressRef = useRef(null);
  const loginStarted = useRef(false);

  const handleLogoutDone = useCallback(() => {
    setLoggingOut(false);
    logoutAddressRef.current = null;
    navigate("/");
  }, [navigate]);

  // Set user address in context when connected
  useEffect(() => {
    if (isConnected && address) setUserAddress(address);
  }, [isConnected, address, setUserAddress]);

  // Load friends and contact profiles once username + auth are ready
  const hasToken = !!accessToken;
  useEffect(() => {
    console.log("[layout] refresh effect:", { username: userData?.username, hasToken, accessToken });
    if (userData?.username && hasToken) {
      refreshFriends(apiCallRef.current).then(() =>
        refreshContactProfiles(apiCallRef.current)
      );
    }
  }, [userData?.username, hasToken, refreshFriends, refreshContactProfiles]);

  //login and auth
  useEffect(() => {
    if (isConnected && address && sessionStorage.getItem("siwe_logged_in") !== address) {
      loginStarted.current = true;
      login().finally(() => { loginStarted.current = false; });
    }
  }, [isConnected, address]);

  // Redirect to onboarding if no username
  useEffect(() => {
    console.log("[layout] onboarding redirect check:", { isConnected, authStep, transitioning, username: userData?.username, loginStarted: loginStarted.current });
    if (isConnected && !authStep && !transitioning && !loginStarted.current && !userData?.username) {
      console.log("[layout] >>> REDIRECTING TO ONBOARDING");
      navigate("/onboarding");
    }
  }, [isConnected, authStep, transitioning, userData?.username, navigate]);

  //logout
  useAccountEffect({
    onDisconnect() {
      logoutAddressRef.current = address;
      sessionStorage.removeItem("siwe_logged_in");
      setLoggingOut(true);
      logout();
    }
  })

  // Logout transition: full-screen, takes priority over all other states
  if (loggingOut) {
    return (
      <VaultLogoutTransition
        address={logoutAddressRef.current}
        onDone={handleLogoutDone}
      />
    );
  }

  // Still rehydrating wagmi — render sidebar shell without content to avoid flash
  const wasLoggedIn = sessionStorage.getItem("siwe_logged_in");
  if (!isConnected && (isReconnecting || wasLoggedIn)) {
    return (
      <div className="min-h-screen">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[68px]'}`}>
          {/* Mobile top bar (hamburger + logo) */}
          <div className="lg:hidden sticky top-0 z-30 bg-base-100/80 backdrop-blur-xl border-b border-base-content/5 px-4 h-14 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn btn-ghost btn-sm btn-square"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center justify-center h-[60vh]">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Not connected: redirect to landing if not already there
  if (!isConnected) {
    if (location.pathname !== '/') {
      return <Navigate to="/" replace />;
    }
    return (
      <>
        <Navbar />
        <Outlet />
      </>
    );
  }

  // Auth loading: full-screen overlay, no dashboard rendered behind it
  if (authStep || transitioning) {
    return (
      <VaultAuthLoading
        authStep={authStep}
        address={address}
        username={userData?.username}
        onTransitionDone={handleTransitionDone}
      />
    );
  }

  // Connected: Sidebar + page content
  return (
    <div className="min-h-screen animate-[auth-page-in_0.3s_ease-out]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[68px]'}`}>
        {/* Mobile top bar (hamburger + logo) */}
        <div className="lg:hidden sticky top-0 z-30 bg-base-100/80 backdrop-blur-xl border-b border-base-content/5 px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-ghost btn-sm btn-square"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <Logo size="sm" />
        </div>

        <Outlet />
      </div>
    </div>
  );
}
