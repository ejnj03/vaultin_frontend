export default function QuoteLoading() {
  return (
    <div className="mt-2 space-y-2.5">
      {/* Skeleton amount row */}
      <div className="flex items-end gap-3">
        <div className="relative h-8 flex-1 rounded-xl bg-primary/[0.04] overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.08] to-transparent"
            style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}
          />
        </div>
        <div className="relative h-4 w-14 rounded-full bg-primary/[0.04] overflow-hidden mb-1">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.08] to-transparent"
            style={{ animation: 'shimmer 1.8s ease-in-out infinite 0.3s' }}
          />
        </div>
      </div>

      {/* Skeleton USD line */}
      <div className="relative h-3 w-16 rounded-full bg-primary/[0.03] overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.06] to-transparent"
          style={{ animation: 'shimmer 1.8s ease-in-out infinite 0.6s' }}
        />
      </div>

      {/* Status label */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <span className="loading loading-dots loading-xs text-primary/30" />
        <span className="text-[11px] text-primary/30 font-medium tracking-wide">Fetching best quote</span>
      </div>
    </div>
  );
}
