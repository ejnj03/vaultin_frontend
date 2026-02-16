import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectKitButton } from 'connectkit';

const EXPLORE_SUBCATEGORIES = [
  {
    to: '/',
    label: 'Prediction Markets',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    to: '/explore-crypto',
    label: 'Crypto',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

function ExploreNav({ open, pathname }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <li>
      <button
        onClick={() => { setExpanded(!expanded); }}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
          text-base-content/50 hover:text-base-content hover:bg-base-content/5
          ${!open ? 'lg:justify-center lg:px-0 lg:gap-0' : ''}
        `}
        title={!open ? 'Explore' : undefined}
      >
        <span className="shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </span>
        <span className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
          Explore
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${expanded ? 'rotate-180' : ''} ${open ? '' : 'lg:hidden'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && open && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-base-content/10 pl-3">
          {EXPLORE_SUBCATEGORIES.map((sub) => (
            <li key={sub.label}>
              <Link
                to={sub.to}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${pathname === sub.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-base-content/50 hover:text-base-content hover:bg-base-content/5'
                  }
                `}
              >
                <span className="shrink-0">{sub.icon}</span>
                {sub.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

const NAV_LINKS = [
  {
    to: '/my-erc',
    label: 'Portfolio',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
      </svg>
    ),
  },
  {
    to: '/track-flows',
    label: 'Flows',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
];

export default function Sidebar({ open, setOpen }) {
  const { pathname } = useLocation();

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024 && open) {
      setOpen(false);
    }
  }, [pathname]);

  const isActive = (link) => pathname.startsWith(link.to);

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
          fixed top-0 left-0 h-full z-50 bg-base-200 border-r border-base-content/5
          flex flex-col transition-all duration-300 ease-in-out
          ${open
            ? 'w-64 translate-x-0'
            : 'w-64 -translate-x-full lg:w-[68px] lg:translate-x-0'
          }
        `}
      >
        {/* Logo — click to toggle sidebar */}
        <div className={`flex items-center shrink-0 h-16 border-b border-base-content/5 ${open ? 'px-5' : 'lg:justify-center px-5 lg:px-0'}`}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 font-extrabold text-xl tracking-tight cursor-pointer select-none"
          >
            <span className="text-primary text-2xl">V</span>
            <span className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
              aultin
            </span>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {/* <ExploreNav open={open} pathname={pathname} /> */}
            {NAV_LINKS.filter(link => link.to !== '/track-flows').map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive(link)
                      ? 'bg-primary/10 text-primary'
                      : 'text-base-content/50 hover:text-base-content hover:bg-base-content/5'
                    }
                    ${!open ? 'lg:justify-center lg:px-0 lg:gap-0' : ''}
                  `}
                  title={!open ? link.label : undefined}
                >
                  <span className="shrink-0">{link.icon}</span>
                  <span className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                    {link.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom: wallet button */}
        <div className="shrink-0 border-t border-base-content/5 p-3">
          <ConnectKitButton.Custom>
            {({ isConnected, show, truncatedAddress, ensName }) => (
              <button
                onClick={show}
                className={`btn btn-primary btn-sm w-full shadow-lg shadow-primary/20 ${!open ? 'lg:btn-square lg:w-full' : ''}`}
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
