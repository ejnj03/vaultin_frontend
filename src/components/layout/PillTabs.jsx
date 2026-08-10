export default function PillTabs({ tabs, activeTab, onTabChange, children }) {
  return (
    <div className="flex items-center gap-1" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              isActive
                ? 'bg-base-content text-base-100 font-semibold'
                : 'text-base-content/40 hover:text-base-content'
            }`}
          >
            {typeof tab.render === 'function' ? tab.render(isActive) : tab.label}
          </button>
        );
      })}
    </div>
  );
}
