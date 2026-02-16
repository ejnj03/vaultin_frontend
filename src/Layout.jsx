import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useAccountEffect } from 'wagmi';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { Outlet } from 'react-router-dom';
import { login, logout } from './utils/useAuth';

export function Layout() {
  const { signMessageAsync } = useSignMessage();
  const { address, isConnected } = useAccount();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (isConnected && address && sessionStorage.getItem("siwe_logged_in") !== address) {
      login(address, signMessageAsync).then(() => {
        sessionStorage.setItem("siwe_logged_in", address)
      })
    }
  }, [isConnected, address]);

  useAccountEffect({
    onDisconnect() {
      logout()
      sessionStorage.removeItem("siwe_logged_in")
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
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-primary">V</span>aultin
          </span>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
