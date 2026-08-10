import { useState } from 'react';
import RequestsPanel from '../components/dashboard/RequestsPanel';
import PendingTransfersPanel from '../components/dashboard/PendingTransfersPanel';
import PendingDepositsPanel from '../components/dashboard/PendingDepositsPanel';
import PillTabs from '../components/layout/PillTabs';

const TABS = [
  { key: 'received', label: 'Received' },
  { key: 'sent', label: 'Sent' },
  { key: 'outgoing', label: 'Pending' },
  { key: 'incoming', label: 'Incoming' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('received');

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto bg-base-200 rounded-box border border-base-content/5 flex flex-col overflow-hidden h-[calc(100vh-96px)]">
        {/* Header */}
        <div className="p-5 border-b border-base-content/5 shrink-0">
          <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium">Activity</p>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-4 py-3">
          <PillTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {activeTab === 'received' && <RequestsPanel filter="received" />}
          {activeTab === 'sent' && <RequestsPanel filter="sent" />}
          {activeTab === 'outgoing' && <PendingTransfersPanel />}
          {activeTab === 'incoming' && <PendingDepositsPanel />}
        </div>
      </div>
    </div>
  );
}
