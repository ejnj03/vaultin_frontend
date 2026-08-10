import { Link } from 'react-router-dom';
import { ConnectKitButton } from 'connectkit';
import Logo from './Logo';

const NAV_LINKS = [
    { to: '#about', label: 'About' },
    { to: '#contact', label: 'Contact' },
    { to: '#help', label: 'Help' },
];

export default function Navbar() {
    return (
        <div className="sticky top-3 z-50 px-4">
            <div className="navbar bg-base-200/70 backdrop-blur-xl rounded-box shadow-lg border border-base-content/5 max-w-6xl mx-auto">
                <div className="flex-1">
                    <Link to="/" className="btn btn-ghost text-2xl font-extrabold tracking-tight gap-0">
                        <Logo size="lg" />
                    </Link>
                </div>
                <div className="flex-none">
                    <ul className="menu menu-horizontal px-1 gap-1 text-sm font-medium">
                        {NAV_LINKS.map((link) => (
                            <li key={link.label}>
                                <a href={link.to} className="rounded-btn">
                                    {link.label}
                                </a>
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
