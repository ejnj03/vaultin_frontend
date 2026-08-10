import { useAccount } from 'wagmi';
import { ChevronRight } from 'lucide-react';
import { CARD } from '../shared/tradeStyles';
import { NETWORK_LOGOS, TOKEN_LOGOS } from '../../../utils/networkLogos';
import { useApi } from '../../../hooks/useApi';

const VITE_CDP_PROJECT_ID = import.meta.env.VITE_CDP_PROJECT_ID;

const ONRAMP_OPTIONS = [
  { asset: 'USDC', network: 'base', label: 'USDC' },
  { asset: 'EURC', network: 'base', label: 'EURC' },
  { asset: 'cbBTC', network: 'base', label: 'cbBTC' },
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
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-base-content mb-4">Buy crypto</h1>
      {ONRAMP_OPTIONS.map((opt) => (
        <button
          key={`${opt.asset}-${opt.network}`}
          type="button"
          onClick={() => openOnramp(opt.asset, opt.network)}
          className={`${CARD} w-full flex items-center gap-4 hover:bg-base-content/[0.08] transition-colors cursor-pointer`}
        >
          <div className="relative shrink-0">
            <img src={TOKEN_LOGOS[opt.asset]} className="w-12 h-12 rounded-full" alt={opt.asset} />
            <img
              src={NETWORK_LOGOS[opt.network]}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-base-300"
              alt={opt.network}
            />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-base font-semibold">{opt.label}</p>
            <p className="text-xs text-base-content/40">Available on Base</p>
          </div>
          <span className="text-xs text-success font-medium shrink-0">0% fee</span>
          <ChevronRight size={14} strokeWidth={1.75} className="text-white/30 shrink-0" />
        </button>
      ))}
      <p className="text-xs text-base-content/30 text-center mt-4">More assets coming soon</p>
    </div>
  );
}
