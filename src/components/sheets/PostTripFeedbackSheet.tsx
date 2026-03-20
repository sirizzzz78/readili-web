import { useState, useEffect } from 'react';
import { PlusCircle, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useTrip, usePackingItems, updateTrip, removeLearnedItems, markUnused, learnItem } from '../../db/hooks';
import { CATEGORY_OPTIONS } from '../../lib/constants';

interface PostTripFeedbackSheetProps {
  tripId: string;
  onClose: () => void;
}

export function PostTripFeedbackSheet({ tripId, onClose }: PostTripFeedbackSheetProps) {
  const { showToast } = useToast();
  const trip = useTrip(tripId);
  const items = usePackingItems(tripId);

  const [unpackedSelections, setUnpackedSelections] = useState<Set<string>>(new Set());
  const [wishlistItems, setWishlistItems] = useState<{ id: string; name: string; category: string }[]>([]);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Essentials');

  useEffect(() => {
    if (trip?.feedbackUnpacked) setUnpackedSelections(new Set(trip.feedbackUnpacked));
    if (trip?.feedbackWishlist) {
      const names = trip.feedbackWishlist.split(',').map(s => s.trim()).filter(Boolean);
      setWishlistItems(names.map(n => ({ name: n, category: 'Essentials', id: crypto.randomUUID() })));
    }
  }, [trip?.id, trip?.feedbackUnpacked, trip?.feedbackWishlist]);

  if (!trip) return null;

  const packedNames = items.filter(i => i.isPacked).map(i => i.name).sort();

  const toggleUnpacked = (name: string) => {
    setUnpackedSelections(prev => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  };

  const addWishlist = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setWishlistItems(prev => [...prev, { id: crypto.randomUUID(), name: trimmed, category: newCategory }]);
    setNewName('');
  };

  const handleSave = async () => {
    await updateTrip(trip.id, {
      hasSubmittedFeedback: true,
      feedbackUnpacked: [...unpackedSelections],
      feedbackWishlist: wishlistItems.map(w => w.name).join(', '),
    });

    await removeLearnedItems([...unpackedSelections]);
    markUnused([...unpackedSelections]);

    for (const item of wishlistItems) {
      await learnItem({ name: item.name, category: item.category, quantity: 1, isMustPack: false });
    }

    showToast('Feedback saved — thanks!', 'success');
    onClose();
  };

  return (
    <div className="px-6 pb-8 max-h-[70dvh] overflow-y-auto">
      <p className="text-[15px] text-[var(--text-secondary)] mb-6">Your feedback helps improve future packing lists.</p>

      {/* Unpacked items */}
      {packedNames.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-2">
            What did you pack but not use?
          </p>
          <div className="flex flex-wrap gap-2">
            {packedNames.map(name => {
              const selected = unpackedSelections.has(name);
              return (
                <button
                  key={name}
                  onClick={() => toggleUnpacked(name)}
                  className={`px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium border border-[var(--border)] transition-colors ${
                    selected ? 'bg-[var(--lavender)] text-white border-transparent' : 'bg-[var(--surface)] text-[var(--text-primary)]'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Wishlist */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-2">
          What do you wish you'd brought?
        </p>
        <Card className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Item name"
            className="flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none min-w-0"
          />
          <button onClick={addWishlist} disabled={!newName.trim()} aria-label="Add wishlist item">
            <PlusCircle size={24} className={newName.trim() ? 'text-[var(--lavender)]' : 'text-[var(--border)]'} />
          </button>
        </Card>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {CATEGORY_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => setNewCategory(c)}
              className={`px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                newCategory === c
                  ? 'bg-[var(--lavender)] text-white'
                  : 'text-[var(--lavender)]'
              }`}
              style={newCategory !== c ? { backgroundColor: 'color-mix(in srgb, var(--lavender) 12%, transparent)' } : {}}
            >
              {c}
            </button>
          ))}
        </div>
        {wishlistItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {wishlistItems.map(item => (
              <span key={item.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[12px] text-[13px] font-medium bg-[var(--lavender)] text-white">
                {item.name} <span className="opacity-70">· {item.category}</span>
                <button onClick={() => setWishlistItems(prev => prev.filter(w => w.id !== item.id))}>
                  <XCircle size={14} className="text-white opacity-70" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSave}>Save Feedback</Button>
    </div>
  );
}
