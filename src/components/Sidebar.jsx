import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectKitButton } from 'connectkit';

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
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive(link)
                      ? 'bg-primary/10 text-primary'
                      : 'text-base-content/50 hover:text-base-content hover:bg-base-content/5'
                    }
                    ${!open ? 'lg:justify-center lg:px-0' : ''}
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
