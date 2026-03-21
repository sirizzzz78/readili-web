import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Brain, Leaf, ChevronRight, X } from 'lucide-react';
import { useTrips, usePackingItems, deleteTrip, duplicateTrip } from '../db/hooks';
import { usePackingItemsForTrips } from '../hooks/usePackingItemsForTrips';
import { TripCard } from '../components/home/TripCard';
import { MountainBackground } from '../components/home/MountainBackground';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { LearnedItemsSheet } from '../components/sheets/LearnedItemsSheet';
import { PostTripFeedbackSheet } from '../components/sheets/PostTripFeedbackSheet';
import { isBeforeToday } from '../lib/dateUtils';
import { LucideIcon } from '../components/ui/LucideIcon';
import { Map } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const trips = useTrips();
  const allItems = usePackingItemsForTrips(trips);

  const { showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showLearned, setShowLearned] = useState(false);
  const [feedbackTripId, setFeedbackTripId] = useState<string | null>(null);
  const [dismissedFeedback, setDismissedFeedback] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem('readiLi.dismissedFeedback') || '[]'))
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingTrips = useMemo(() =>
    trips
      .filter(t => new Date(t.startDate) >= today)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [trips, today]
  );

  const pastTrips = useMemo(() =>
    trips
      .filter(t => new Date(t.startDate) < today)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [trips, today]
  );

  const feedbackTrip = useMemo(() =>
    pastTrips.find(t => isBeforeToday(t.endDate) && !t.hasSubmittedFeedback && !dismissedFeedback.has(t.id)),
    [pastTrips, dismissedFeedback]
  );

  const dismissFeedback = useCallback((tripId: string) => {
    setDismissedFeedback(prev => {
      const next = new Set(prev);
      next.add(tripId);
      localStorage.setItem('readiLi.dismissedFeedback', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleDuplicate = useCallback(async (tripId: string) => {
    const source = trips.find(t => t.id === tripId);
    if (!source) return;
    try {
      await duplicateTrip(source);
      showToast('Trip duplicated', 'success');
    } catch {
      showToast('Failed to duplicate trip', 'info');
    }
  }, [trips, showToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteTrip(deleteTarget);
      showToast('Trip deleted', 'success');
    } catch {
      showToast('Failed to delete trip', 'info');
    }
    setDeleteTarget(null);
  }, [deleteTarget, showToast]);

  const deleteTargetTrip = trips.find(t => t.id === deleteTarget);

  return (
    <div className="min-h-dvh relative" style={{ backgroundColor: 'var(--home-bg)' }}>
      {/* Mountain background at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <MountainBackground />
      </div>

      <div className="relative z-10 pb-24">
        <div style={{ padding: '1.5rem var(--page-px)' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-semibold text-[var(--text-primary)] tracking-tight" style={{ fontSize: 'var(--text-page-title)' }}>
              My Trips
            </h1>
            <button
              onClick={() => setShowLearned(true)}
              aria-label="Learned items"
              className="flex items-center gap-2 rounded-full"
              style={{ padding: '6px 28px', backgroundColor: 'color-mix(in srgb, var(--lavender) 12%, transparent)' }}
            >
              <Brain size={16} className="text-[var(--lavender)]" />
              <span className="text-[12px] font-semibold text-[var(--lavender)]">Learned</span>
            </button>
          </div>

          {/* Feedback nudge */}
          {feedbackTrip && (
            <div
              className="w-full mb-3 flex items-center gap-3.5 p-4 rounded-[14px]"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--salmon) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--salmon) 30%, transparent)',
              }}
            >
              <button
                onClick={() => setFeedbackTripId(feedbackTrip.id)}
                className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
              >
                <Leaf size={24} className="text-[var(--salmon)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                    How was {feedbackTrip.destination}?
                  </p>
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    Leave feedback to improve future lists
                  </p>
                </div>
                <ChevronRight size={12} className="text-[var(--text-secondary)] shrink-0" />
              </button>
              <button
                onClick={() => dismissFeedback(feedbackTrip.id)}
                aria-label="Dismiss feedback prompt"
                className="p-2 -m-1 rounded-full shrink-0"
              >
                <X size={14} className="text-[var(--text-secondary)]" />
              </button>
            </div>
          )}

          {/* Empty state */}
          {trips.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-5">
              <Map size={56} className="text-[var(--lavender)] opacity-60" />
              <div className="text-center">
                <h2 className="font-semibold text-[var(--text-primary)] tracking-tight" style={{ fontSize: 'var(--text-section-title)' }}>
                  The trail starts here
                </h2>
                <p className="text-[var(--text-secondary)] mt-2" style={{ fontSize: 'var(--text-body)' }}>
                  Create your first trip and we'll handle the packing list.
                </p>
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingTrips.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-3">
                Upcoming
              </p>
              <div className="flex flex-col gap-3">
                {upcomingTrips.map(trip => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    items={allItems[trip.id] ?? []}
                    isPast={false}
                    onDuplicate={() => handleDuplicate(trip.id)}
                    onDelete={() => setDeleteTarget(trip.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {pastTrips.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-3">
                Past
              </p>
              <div className="flex flex-col gap-3">
                {pastTrips.map(trip => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    items={allItems[trip.id] ?? []}
                    isPast={true}
                    onDuplicate={() => handleDuplicate(trip.id)}
                    onDelete={() => setDeleteTarget(trip.id)}
                    onFeedback={() => setFeedbackTripId(trip.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAB — fixed bottom-right */}
      <button
        onClick={() => navigate('/setup')}
        aria-label="Create new trip"
        className="fixed z-20 w-14 h-14 rounded-full bg-[var(--salmon)] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        style={{
          bottom: 'max(env(safe-area-inset-bottom, 0px) + 1.5rem, 2rem)',
          right: 'max(calc((100vw - 480px) / 2 + 1.5rem), 1.5rem)',
          boxShadow: '0 4px 12px color-mix(in srgb, var(--salmon) 30%, transparent)',
        }}
      >
        <Plus size={22} className="text-white" strokeWidth={2.5} />
      </button>

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Trip?"
        message={deleteTargetTrip ? `Are you sure you want to delete your trip to ${deleteTargetTrip.destination}? This cannot be undone.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Learned items */}
      <Modal open={showLearned} onClose={() => setShowLearned(false)} title="Learned Items">
        <LearnedItemsSheet onClose={() => setShowLearned(false)} />
      </Modal>

      {/* Feedback */}
      {feedbackTripId && (
        <Modal open={true} onClose={() => setFeedbackTripId(null)} title="Review your packing">
          <PostTripFeedbackSheet tripId={feedbackTripId} onClose={() => setFeedbackTripId(null)} />
        </Modal>
      )}
    </div>
  );
}
