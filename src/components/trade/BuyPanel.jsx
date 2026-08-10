import { useAccount } from 'wagmi';
import { CARD } from './tradeStyles';
import { NETWORK_LOGOS, TOKEN_LOGOS } from '../../utils/networkLogos';
import { useApi } from '../../hooks/useApi';

const VITE_CDP_PROJECT_ID = import.meta.env.VITE_CDP_PROJECT_ID;

const ONRAMP_OPTIONS = [
  { asset: 'USDC', network: 'base', label: 'USDC', sublabel: 'on Base Network' },
  { asset: 'EURC', network: 'base', label: 'EURC', sublabel: 'on Base Network' },
  { asset: 'cbBTC', network: 'base', label: 'cbBTC', sublabel: 'on Base Network' },
];

export default function BuyPanel() {
  const { address } = useAccount();
  const { apiCall } = useApi();

  const openOnramp = async (asset, network) => {

    const {session_token: sessionToken} = await apiCall("trade/coinbase/session-token", {
      method: "POST",
      body: {address, network, asset}
    })

    const url = new URL('https://pay.coinbase.com/buy/select-asset');
    url.searchParams.set('appId', VITE_CDP_PROJECT_ID);
    url.searchParams.set('defaultAsset', asset);
    url.searchParams.set('defaultNetwork', network);
    url.searchParams.set('sessionToken', sessionToken);
    url.searchParams.set('addresses', JSON.stringify({
      [address]: [network]
    }));
    window.open(url.toString(), 'coinbase-onramp', 'width=500,height=700');
  };

  return (
    <div className="space-y-1.5">
      {ONRAMP_OPTIONS.map((opt) => (
        <button
          key={`${opt.asset}-${opt.network}`}
          type="button"
          onClick={() => openOnramp(opt.asset, opt.network)}
          className={`${CARD} w-full flex items-center gap-3 hover:bg-base-content/[0.08] transition-colors cursor-pointer`}
        >
          <div className="relative shrink-0">
            <img src={TOKEN_LOGOS[opt.asset]} className="w-10 h-10 rounded-full" alt={opt.asset} />
            <img
              src={NETWORK_LOGOS[opt.network]}
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-base-300"
              alt={opt.network}
            />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold">{opt.label}</p>
            <p className="text-[11px] text-base-content/40">{opt.sublabel}</p>
          </div>
          <span className="text-[11px] text-success font-medium shrink-0">0% fee</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-base-content/20 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      ))}
    </div>
  );
}
