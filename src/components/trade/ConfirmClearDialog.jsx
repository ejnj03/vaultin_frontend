export default function ConfirmClearDialog({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-base-100 rounded-xl shadow-xl p-5 w-full max-w-xs mx-4" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-semibold mb-1">Clear all fields?</p>
        <p className="text-xs text-base-content/50 mb-4">This will reset the form to its default state.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn btn-sm btn-ghost flex-1">Cancel</button>
          <button type="button" onClick={onConfirm} className="btn btn-sm btn-error flex-1">Clear</button>
        </div>
      </div>
    </div>
  );
}
