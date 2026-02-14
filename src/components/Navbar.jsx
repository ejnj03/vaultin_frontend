import { Link, useLocation } from 'react-router-dom';
import { ConnectKitButton } from 'connectkit';

const NAV_LINKS = [
    { to: '/', label: 'About', exact: true },
    { to: '/', label: 'Contact' },
    { to: '/', label: 'Help' },
];

export default function Navbar() {
    const { pathname } = useLocation();

    const isActive = (link) =>
        link.exact ? pathname === link.to : pathname.startsWith(link.to);

    return (
        <div className="sticky top-3 z-50 px-4">
            <div className="navbar bg-base-200/70 backdrop-blur-xl rounded-box shadow-lg border border-base-content/5 max-w-6xl mx-auto">
                <div className="flex-1">
                    <Link to="/" className="btn btn-ghost text-2xl font-extrabold tracking-tight">
                        <span className="text-primary">V</span>aultin
                    </Link>
                </div>
                <div className="flex-none">
                    <ul className="menu menu-horizontal px-1 gap-1 text-sm font-medium">
                        {NAV_LINKS.map((link) => (
                            <li key={link.to}>
                                <Link
                                    to={link.to}
                                    className={`rounded-btn ${isActive(link) ? 'text-primary bg-primary/10' : ''}`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <ConnectKitButton.Custom>
                        {({ isConnected, show, truncatedAddress, ensName }) => (
                            <button
                                onClick={show}
                                className="btn btn-ghost btn-sm text-sm font-medium border border-base-content/10 hover:border-primary/30"
                            >
                                {isConnected ? ensName ?? truncatedAddress : "Connect Wallet"}
                            </button>
                        )}
                    </ConnectKitButton.Custom>
                </div>
            </div>
        </div>
    );
}
