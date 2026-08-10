export default function SearchBar({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 bg-base-content/5 border border-base-content/10 rounded-full px-4 py-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-base-content/50 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        type="text"
        className="grow text-sm text-base-content placeholder-base-content/50 bg-transparent outline-none"
        placeholder="Filter connections..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
