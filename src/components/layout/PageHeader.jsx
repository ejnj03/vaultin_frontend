export default function PageHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 rounded-full bg-primary" />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      {children}
    </div>
  );
}
