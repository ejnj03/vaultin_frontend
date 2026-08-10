export default function PendingDepositsPanel() {
  return (
    <div className="flex flex-col items-center justify-center pt-20 pb-12 px-6">
      <div className="w-14 h-14 rounded-full bg-base-content/5 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-7 h-7 text-base-content/20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      </div>
      <p className="text-base font-medium text-base-content/50 mb-1">No incoming deposits</p>
      <p className="text-[13px] text-base-content/60 text-center max-w-xs">Incoming deposits will appear here when detected.</p>
    </div>
  );
}
