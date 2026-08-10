export default function ArrowDivider({ onClick }) {
  const interactive = !!onClick;
  return (
    <div className="flex items-center justify-center -my-3 relative z-10">
      <button
        type="button"
        onClick={onClick}
        disabled={!interactive}
        className={`w-9 h-9 rounded-full bg-base-200 border border-base-content/10 flex items-center justify-center transition-all ${
          interactive
            ? 'cursor-pointer hover:bg-base-content/10 hover:border-base-content/20 active:scale-95 group'
            : ''
        }`}
      >
        {interactive ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
            className="w-4 h-4 text-base-content/30 group-hover:text-base-content/60 transition-all">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
            className="w-4 h-4 text-base-content/30">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
          </svg>
        )}
      </button>
    </div>
  );
}
