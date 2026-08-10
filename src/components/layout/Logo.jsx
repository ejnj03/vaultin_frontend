const SIZES = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export default function Logo({ size = 'md', collapsed = false }) {
  return (
    <span className={`${SIZES[size]} font-extrabold tracking-tight`}>
      <span className="text-primary font-bold tracking-tight">V</span>
      <span className={`text-base-content font-semibold tracking-tight${collapsed ? ' inline-block transition-all duration-200 lg:opacity-0 lg:w-0 lg:overflow-hidden' : ''}`}>aultin</span>
    </span>
  );
}
