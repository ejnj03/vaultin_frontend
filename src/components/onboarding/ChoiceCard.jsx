export default function ChoiceCard({ selected, onClick, title, desc }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-4 cursor-pointer transition-all duration-150 relative overflow-hidden flex items-start gap-3.5 outline-none ${
        selected
          ? "bg-primary/[0.04] border-[1.5px] border-primary shadow-[inset_0_0_0_1px_oklch(64%_0.155_152_/_0.07)]"
          : "bg-base-100 border-[1.5px] border-base-content/15 hover:border-base-content/20 hover:bg-base-100/80"
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent transition-opacity duration-200 ${
          selected ? "opacity-45" : "opacity-0"
        }`}
      />
      <div className="flex-1">
        <div className={`text-sm font-semibold tracking-tight mb-1 leading-snug transition-colors duration-150 ${selected ? "text-base-content" : "text-base-content/60"}`}>
          {title}
        </div>
        <div className={`text-xs leading-relaxed transition-colors duration-150 ${selected ? "text-base-content/30" : "text-base-content/30"}`}>
          {desc}
        </div>
      </div>
      <div
        className={`w-[18px] h-[18px] rounded-full shrink-0 mt-0.5 flex items-center justify-center transition-all duration-150 ${
          selected ? "bg-primary border-2 border-primary" : "border-2 border-base-content/20"
        }`}
      >
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-primary-content" />}
      </div>
    </button>
  );
}
