import { useSearchParams } from 'react-router-dom';
import SwapPanel from '../components/trade/swap/SwapPanel';
import TransferPanel from '../components/trade/transfer/TransferPanel';
import RequestPanel from '../components/trade/request/RequestPanel';
import BuyPanel from '../components/trade/buy/BuyPanel';
import PillTabs from '../components/layout/PillTabs';

const TABS = [
  { key: 'buy', label: 'Buy' },
  { key: 'swap', label: 'Swap' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'request', label: 'Request' },
];

export default function Trade() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'swap';

  const setTab = (tab) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div className="flex items-start justify-center pt-8 sm:pt-12 px-4">
      <div className="w-full max-w-[400px]">
        {/* Widget card */}
        <div className="bg-base-200 rounded-3xl border border-base-content/5 p-3">
          {/* Tabs */}
          <div className="mb-3 px-1">
            <PillTabs tabs={TABS} activeTab={activeTab} onTabChange={setTab} />
          </div>

          {/* Panels — always mounted for state preservation */}
          {activeTab === 'buy' && <BuyPanel />}
          <div className={activeTab === 'swap' ? '' : 'hidden'}><SwapPanel /></div>
          <div className={activeTab === 'transfer' ? '' : 'hidden'}><TransferPanel /></div>
          <div className={activeTab === 'request' ? '' : 'hidden'}><RequestPanel /></div>
        </div>
      </div>
    </div>
  );
}
