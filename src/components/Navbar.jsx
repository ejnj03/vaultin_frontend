import { Link } from 'react-router-dom';
import { ConnectKitButton } from 'connectkit';

export default function Navbar() {
    return (<div className="navbar bg-base-100 text-start shadow-sm">
  <div className="flex-1">
    <Link to="/" className="btn btn-ghost text-4xl">Vault.</Link>
  </div>
  <div className="flex-none">
    <ul className="menu menu-horizontal px-3 text-xl gap-5 font-semibold ">
      <li className="justify-center"><Link to="/track-flows">Track Flows</Link></li>
      <li>
        <details>
          <summary className="w-50 justify-center gap-5">ERC-20 Tokens</summary>
          <ul className="bg-base-100 rounded-t-none p-2 w-50 z-50">
            <li><Link to="/wallet-balances">Balance Search</Link></li>
            <li><Link to="/my-erc">My Balances</Link></li>
          </ul>
        </details>
      </li>
      <li>
        <ConnectKitButton />
      </li>
    </ul>
  </div>
</div>)
}