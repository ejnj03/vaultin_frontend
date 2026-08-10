import { useNavigate } from 'react-router-dom';

export default function PendingTransfersPanel() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center pt-20 pb-12 px-6">
      <div className="w-14 h-14 rounded-full bg-base-content/5 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-7 h-7 text-base-content/20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <p className="text-base font-medium text-base-content/50 mb-1">No pending transfers</p>
      <p className="text-[13px] text-base-content/60 text-center max-w-xs mb-5">Pending transfers you send will appear here.</p>
      <button
        onClick={() => navigate('/trade?tab=transfer')}
        className="btn btn-ghost btn-sm text-primary/70 hover:text-primary hover:bg-primary/5 rounded-full px-4 font-medium"
      >
        Send a transfer
      </button>
    </div>
  );
}
