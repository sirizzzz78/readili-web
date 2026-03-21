import { useState, useMemo } from 'react';
import { Trash2, Brain } from 'lucide-react';
import { useLearnedItems, removeLearnedItems, getUnusedNames, clearUnused } from '../../db/hooks';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface LearnedItemsSheetProps {
  onClose: () => void;
}

export function LearnedItemsSheet({ onClose }: LearnedItemsSheetProps) {
  const items = useLearnedItems();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const unusedNames = useMemo(() => [...getUnusedNames()].sort(), [items]);

  if (items.length === 0 && unusedNames.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4" style={{ padding: '2rem var(--card-px) 3rem' }}>
        <Brain size={48} className="text-[var(--lavender)] opacity-50" />
        <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">No learned items yet</h3>
        <p className="text-[14px] text-[var(--text-secondary)] text-center px-10">
          Items you add to trips and wishlist items from feedback will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[70dvh] overflow-y-auto" style={{ padding: '0 var(--card-px) 2rem' }}>
      {items.length > 0 && (
        <Card className="mb-4">
          {items.map((item, i) => (
            <div key={item.name}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[var(--text-primary)]">{item.name}</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">{item.category}</p>
                </div>
                {item.quantity > 1 && (
                  <span className="text-[13px] text-[var(--text-secondary)]">&times;{item.quantity}</span>
                )}
                <button onClick={() => setDeleteTarget(item.name)} aria-label={`Delete ${item.name}`} className="p-2.5 -m-1 rounded-full">
                  <Trash2 size={16} className="text-[var(--destructive)]" />
                </button>
              </div>
              {i < items.length - 1 && <div className="border-b border-[var(--border)] my-2.5" />}
            </div>
          ))}
        </Card>
      )}

      {unusedNames.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-2 px-1">
            Not used on last trip
          </p>
          <Card>
            {unusedNames.map((name, i) => (
              <div key={name}>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-[var(--text-primary)] capitalize">{name}</span>
                  <button
                    onClick={() => clearUnused([name])}
                    className="text-[13px] font-medium text-[var(--lavender)]"
                  >
                    Dismiss
                  </button>
                </div>
                {i < unusedNames.length - 1 && <div className="border-b border-[var(--border)] my-2.5" />}
              </div>
            ))}
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Item?"
        message={deleteTarget ? `"${deleteTarget}" will no longer be added to future trips automatically.` : ''}
        confirmLabel="Remove"
        onConfirm={async () => {
          try {
            if (deleteTarget) await removeLearnedItems([deleteTarget]);
          } catch { /* silently handled */ }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
