import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useAccountEffect } from 'wagmi';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { Outlet } from 'react-router-dom';
import { login, logout, check_registered } from './utils/useAuth';
import RegisterModal from './components/RegisterModal';

export function Layout() {
  const { signMessageAsync } = useSignMessage();
  const { address, isConnected } = useAccount();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  //state regarding whether we're checking if the user is registered
  const [checking, setChecking] = useState(false);
  const [username, setUsername] = useState(() => sessionStorage.getItem("vaultin_username"))

  //login and auth
  useEffect(() => {
    if (isConnected && address && sessionStorage.getItem("siwe_logged_in") !== address) {
      setChecking(true)
      setUsername(null)
      login(address, signMessageAsync).then(async () => {
        sessionStorage.setItem("siwe_logged_in", address)
        const user_data = await check_registered()
        const name = user_data?.username ?? null
        setUsername(name)
        if (name) {
          sessionStorage.setItem("vaultin_username", name)
        }
        setChecking(false)
      })
    }
  }, [isConnected, address]);

  //logout
  useAccountEffect({
    onDisconnect() {
      logout()
      sessionStorage.removeItem("siwe_logged_in")
      sessionStorage.removeItem("vaultin_username")
      setUsername(null)
    }
  })

  // Not connected: top Navbar + page content
  if (!isConnected) {
    return (
      <>
        <Navbar />
        <Outlet />
      </>
    );
  }

  // Connected: Sidebar + page content
  return (
    <div className="min-h-screen">
      {!checking && !username && (
        <RegisterModal onRegistered={(name) => {
          setUsername(name)
          sessionStorage.setItem("vaultin_username", name)
        }} />
      )}
      {checking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-xl p-8 text-center shadow-xl">
            <span className="loading loading-spinner loading-lg" />
            <p className="mt-4 font-medium">Logging in...</p>
          </div>
        </div>
      )}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} username={username} />

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
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-primary">V</span>aultin
          </span>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
