import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ConnectKitButton } from 'connectkit';
import { useUser } from '../../contexts/UserContext';
import Logo from './Logo';

const MAIN_LINKS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
  },
  {
    to: '/wallet',
    label: 'Wallet',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
      </svg>
    ),
  },
];

const TRADE_LINKS = [
  {
    to: '/trade?tab=buy',
    tab: 'buy',
    label: 'Buy',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    to: '/trade?tab=swap',
    tab: 'swap',
    label: 'Swap',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
      </svg>
    ),
  },
  {
    to: '/trade?tab=transfer',
    tab: 'transfer',
    label: 'Transfer',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    to: '/trade?tab=request',
    tab: 'request',
    label: 'Request',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

const CONNECT_LINKS = [
  {
    to: '/contacts',
    label: 'Contacts',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    to: '/requests',
    label: 'Requests',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 16v6m-3-3h6" strokeWidth={2} />
      </svg>
    ),
  },
];

function NavLink({ link, active, open }) {
  return (
    <Link
      to={link.to}
      className={`
        flex items-center rounded-lg text-sm font-medium transition-colors relative
        ${active
          ? `bg-primary/10 text-primary ${open ? 'border-l-[3px] border-primary pl-[9px]' : ''}`
          : 'text-base-content/45 hover:text-base-content/80 hover:bg-base-content/[0.04]'
        }
        ${open ? 'gap-3 px-3 py-2.5' : 'justify-center p-3 lg:justify-center lg:px-0'}
      `}
      title={!open ? link.label : undefined}
    >
      <span className="shrink-0">{link.icon}</span>
      <span className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
        {link.label}
      </span>
    </Link>
  );
}

function SectionLabel({ label, open }) {
  return (
    <p className={`text-[10px] uppercase tracking-[0.1em] font-semibold text-base-content/25 mb-2 mt-5 transition-opacity duration-200 ${open ? 'px-3' : 'lg:hidden px-3'}`}>
      {label}
    </p>
  );
}

export default function Sidebar({ open, setOpen }) {
  const { userData, profileAvatar } = useUser();
  const { pathname, search } = useLocation();

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024 && open) {
      setOpen(false);
    }
  }, [pathname]);

  const isProfileRoute = pathname.startsWith('/settings');

  const isMainActive = (link) => !isProfileRoute && pathname.startsWith(link.to);

  // Trade links match on /trade pathname + tab query param
  const currentTab = pathname === '/trade' ? new URLSearchParams(search).get('tab') || 'swap' : null;
  const isTradeActive = (link) => !isProfileRoute && link.tab === currentTab;

  const isConnectActive = (link) => !isProfileRoute && pathname.startsWith(link.to);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 bg-base-100 border-r border-base-content/[0.06]
          flex flex-col transition-all duration-300 ease-in-out
          ${open
            ? 'w-64 translate-x-0'
            : 'w-64 -translate-x-full lg:w-[68px] lg:translate-x-0'
          }
        `}
      >
        {/* Logo — click to toggle sidebar */}
        <div className={`flex items-center shrink-0 h-16 border-b border-base-content/[0.06] ${open ? 'px-5' : 'lg:justify-center px-5 lg:px-0'}`}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-0 font-extrabold text-xl tracking-tight cursor-pointer select-none"
          >
            <Logo size="lg" collapsed={!open} />
          </button>
        </div>

        {/* Nav links */}
        <nav className={`flex-1 py-4 overflow-y-auto ${open ? 'px-3' : 'px-2'}`}>
          {/* Main */}
          <ul className="space-y-1">
            {MAIN_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink link={link} active={isMainActive(link)} open={open} />
              </li>
            ))}
          </ul>

          {/* Trade section */}
          <div>
            <SectionLabel label="Trade" open={open} />
            <ul className="space-y-1">
              {TRADE_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink link={link} active={isTradeActive(link)} open={open} />
                </li>
              ))}
            </ul>
          </div>

          {/* Connect section */}
          <div>
            <SectionLabel label="Connect" open={open} />
            <ul className="space-y-1">
              {CONNECT_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink link={link} active={isConnectActive(link)} open={open} />
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Profile link pinned above bottom */}
        <div className="px-3 pb-2">
          <Link
            to="/settings"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isProfileRoute
                ? 'bg-primary/10 text-primary rounded-lg'
                : 'text-base-content/45 hover:text-base-content/80 hover:bg-base-content/[0.04]'
              }
              ${!open ? 'lg:justify-center lg:px-0 lg:gap-0' : ''}
            `}
            title={!open ? (userData?.username || 'Settings') : undefined}
          >
            <span className="shrink-0">
              {profileAvatar ? (
                <img src={profileAvatar} className="w-5 h-5 rounded-full object-cover" alt="" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              )}
            </span>
            <span className={`truncate transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
              {userData?.username || 'Settings'}
            </span>
          </Link>
        </div>

        {/* Bottom: wallet button — neutral style, not green */}
        <div className="shrink-0 border-t border-base-content/[0.06] p-3">
          <ConnectKitButton.Custom>
            {({ isConnected, show, truncatedAddress, ensName }) => (
              <button
                onClick={show}
                className={`btn btn-sm w-full bg-base-300 border border-base-content/20 shadow-sm text-base-content/70 hover:bg-base-200 hover:border-base-content/25 font-mono text-xs ${!open ? 'lg:btn-square lg:w-full' : ''}`}
                title={!open ? (isConnected ? ensName ?? truncatedAddress : 'Connect') : undefined}
              >
                {!open ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 hidden lg:block">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                ) : null}
                <span className={!open ? 'lg:hidden' : ''}>
                  {isConnected ? ensName ?? truncatedAddress : 'Connect Wallet'}
                </span>
              </button>
            )}
          </ConnectKitButton.Custom>
        </div>
      </aside>
    </>
  );
}
