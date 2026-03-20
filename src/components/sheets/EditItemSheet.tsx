import { useState } from 'react';
import { Tag, Folder, Hash, Star } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Stepper } from '../ui/Stepper';
import { Toggle } from '../ui/Toggle';
import { updatePackingItem } from '../../db/hooks';
import type { PackingItem } from '../../db/models';

interface EditItemSheetProps {
  item: PackingItem;
  existingCategories: string[];
  onClose: () => void;
}

export function EditItemSheet({ item, existingCategories, onClose }: EditItemSheetProps) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [quantity, setQuantity] = useState(item.quantity);
  const [isMustPack, setIsMustPack] = useState(item.isMustPack);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    const resolvedCategory = isMustPack ? 'Essentials' : category.trim();
    await updatePackingItem(item.id, {
      name: name.trim(),
      category: resolvedCategory,
      quantity,
      isMustPack,
    });
    onClose();
  };

  const categories = existingCategories.filter(c => c !== 'Essentials' || !isMustPack);

  return (
    <div className="px-6 pb-8">
      <p className="text-[15px] text-[var(--text-secondary)] mb-6">Update this item's details.</p>

      <div className="flex flex-col gap-3">
        <Card className="flex items-center gap-3">
          <Tag size={18} className="text-[var(--lavender)] shrink-0" />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Item name"
            className="flex-1 bg-transparent text-[16px] text-[var(--text-primary)] outline-none"
          />
        </Card>

        {!isMustPack && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-2 px-1">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    category === cat ? 'bg-[var(--lavender)] text-white' : 'text-[var(--lavender)]'
                  }`}
                  style={category !== cat ? { backgroundColor: 'color-mix(in srgb, var(--lavender) 12%, transparent)' } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
            {!categories.includes(category) && (
              <Card className="flex items-center gap-3 mt-2">
                <Folder size={18} className="text-[var(--lavender)] shrink-0" />
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. Misc, Snacks, Tech"
                  className="flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none"
                />
              </Card>
            )}
          </div>
        )}

        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hash size={18} className="text-[var(--lavender)]" />
            <span className="text-[16px] font-medium text-[var(--text-primary)]">Quantity</span>
          </div>
          <Stepper value={quantity} onChange={setQuantity} />
        </Card>

        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star size={18} className="text-[var(--lavender)]" />
            <span className="text-[16px] font-medium text-[var(--text-primary)]">Must Pack</span>
          </div>
          <Toggle checked={isMustPack} onChange={setIsMustPack} />
        </Card>
      </div>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={!canSave}>Save Changes</Button>
      </div>
    </div>
  );
}
