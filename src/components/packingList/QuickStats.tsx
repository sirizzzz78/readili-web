import { LucideIcon } from '../ui/LucideIcon';
import { CATEGORY_ICONS } from '../../lib/constants';
import type { PackingItem } from '../../db/models';

interface QuickStatsProps {
  groupedItems: [string, PackingItem[]][];
  mustPackItems: PackingItem[];
  onScrollToCategory?: (category: string) => void;
}

export function QuickStats({ groupedItems, mustPackItems, onScrollToCategory }: QuickStatsProps) {
  const allSections: { name: string; packed: number; total: number; iconName: string }[] = [];

  if (mustPackItems.length > 0) {
    allSections.push({
      name: 'Must Pack',
      packed: mustPackItems.filter(i => i.isPacked).length,
      total: mustPackItems.length,
      iconName: 'star',
    });
  }

  for (const [category, items] of groupedItems) {
    allSections.push({
      name: category,
      packed: items.filter(i => i.isPacked).length,
      total: items.length,
      iconName: CATEGORY_ICONS[category] || 'tag',
    });
  }

  if (allSections.length === 0) return null;

  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)]">
        Quick Stats
      </span>
      <div
        style={{
          marginTop: 8,
          padding: 'var(--card-px)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(allSections.length, 7)}, 1fr)`,
          gap: 8,
          justifyItems: 'center',
        }}>
          {allSections.map(section => {
            const pct = section.total > 0 ? Math.round((section.packed / section.total) * 100) : 0;
            return (
              <div
                key={section.name}
                title={`${section.name}: ${section.packed}/${section.total} packed`}
                role="button"
                tabIndex={0}
                onClick={() => onScrollToCategory?.(section.name)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onScrollToCategory?.(section.name); } }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(to top, var(--salmon) ${pct}%, var(--lavender) ${pct}%)`,
                  transition: 'background 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                <LucideIcon name={section.iconName} size={18} style={{ color: '#FFFFFF' }} strokeWidth={2.2} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
