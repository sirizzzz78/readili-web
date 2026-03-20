import { ChevronRight, MoreVertical, Copy, Trash2, Star, MessageSquare } from 'lucide-react';
import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Trip, PackingItem } from '../../db/models';
import { getFormattedDateRange, getTripDays } from '../../db/hooks';
import { ProgressBar } from '../ui/ProgressBar';
import { LucideIcon } from '../ui/LucideIcon';
import { ACTIVITIES, CATEGORY_ICONS } from '../../lib/constants';

interface TripCardProps {
  trip: Trip;
  items: PackingItem[];
  isPast: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onFeedback?: () => void;
}

export const TripCard = memo(function TripCard({ trip, items, isPast, onDuplicate, onDelete, onFeedback }: TripCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const packed = items.filter(i => i.isPacked).length;
  const total = items.length;
  const progress = total > 0 ? packed / total : 0;
  const complete = packed === total && total > 0;
  const days = getTripDays(trip.startDate, trip.endDate);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
      className={`rounded-[14px] border border-[var(--border)] overflow-hidden cursor-pointer transition-transform active:scale-[0.99] ${
        isPast ? 'bg-[var(--surface-past)]' : 'bg-[var(--surface)]'
      }`}
      onClick={() => navigate(`/trip/${trip.id}`)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold truncate ${isPast ? 'text-[var(--blue-faint)]' : 'text-[var(--text-primary)]'}`} style={{ fontSize: 'var(--text-card-title)' }}>
              {trip.destination}
            </h3>
            <p className={`text-[12px] mt-1 ${isPast ? 'text-[var(--blue-pale)]' : 'text-[var(--text-secondary)]'}`}>
              {getFormattedDateRange(trip.startDate, trip.endDate)}
            </p>
            {trip.activities.length > 0 && (
              <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                {trip.activities.map(actId => {
                  const act = ACTIVITIES.find(a => a.id === actId);
                  if (!act) return null;
                  return (
                    <span
                      key={actId}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-medium text-[var(--lavender)] shrink-0"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 12%, transparent)' }}
                    >
                      <LucideIcon name={act.icon} size={11} />
                      {act.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
            <span
              className={`px-2.5 py-1 rounded-[20px] text-[11px] font-semibold ${
                isPast
                  ? 'bg-[var(--border)] text-[var(--blue-faint)]'
                  : 'bg-[var(--lavender)] text-white'
              }`}
            >
              {days}d
            </span>
            <div className="flex items-center gap-1">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  aria-label="Trip options"
                  className="p-2.5 -m-1.5 rounded-full hover:bg-[var(--border)]"
                >
                  <MoreVertical size={16} className="text-[var(--text-secondary)]" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 z-20 bg-[var(--surface)] border border-[var(--border)] rounded-[10px] shadow-lg py-1 min-w-[160px]">
                    {isPast && onFeedback && (
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(false); onFeedback(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
                      >
                        {trip.hasSubmittedFeedback ? <MessageSquare size={14} /> : <Star size={14} />}
                        {trip.hasSubmittedFeedback ? 'View Feedback' : 'Leave Feedback'}
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(false); onDuplicate(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
                    >
                      <Copy size={14} /> Duplicate Trip
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[14px] text-[var(--destructive)] hover:bg-[var(--border)] transition-colors"
                    >
                      <Trash2 size={14} /> Delete Trip
                    </button>
                  </div>
                )}
              </div>
              <ChevronRight size={12} className="text-[var(--text-secondary)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-5 flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar progress={progress} complete={complete} />
        </div>
        <span className={`text-[12px] shrink-0 ${complete ? 'text-[var(--salmon)]' : 'text-[var(--text-secondary)]'}`}>
          {packed}/{total}
        </span>
      </div>
    </div>
  );
});
