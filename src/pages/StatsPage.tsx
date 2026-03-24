import { useMemo, useState, useEffect } from 'react';
import { Building, Briefcase, Star } from 'lucide-react';
import { useTrips } from '../db/hooks';
import { usePackingItemsForTrips } from '../hooks/usePackingItemsForTrips';
import { computeTravelStats } from '../lib/travelStats';
import { WorldMap } from '../components/stats/WorldMap';
import { fetchDestinationPhoto, getCachedPhoto, isPhotoCacheFresh, type PhotoResult } from '../lib/destinationPhoto';

export function StatsPage() {
  const trips = useTrips();
  const allItems = usePackingItemsForTrips(trips);

  const stats = useMemo(() => computeTravelStats(trips, allItems), [trips, allItems]);

  // Photo for top destination
  const [topPhoto, setTopPhoto] = useState<PhotoResult | null>(null);

  useEffect(() => {
    if (!stats.topDestinationFullName) return;

    const cached = getCachedPhoto(stats.topDestinationFullName);
    if (cached) {
      setTopPhoto(cached);
      if (isPhotoCacheFresh(stats.topDestinationFullName)) return;
    }

    const ac = new AbortController();
    fetchDestinationPhoto(stats.topDestinationFullName, ac.signal)
      .then(p => { if (!ac.signal.aborted) setTopPhoto(p); })
      .catch(() => {});
    return () => ac.abort();
  }, [stats.topDestinationFullName]);

  return (
    <div className="min-h-dvh relative" style={{ backgroundColor: 'var(--home-bg)' }}>
      <div className="relative z-10 pb-24">
        <div style={{ padding: '1.5rem var(--page-px)' }}>
          {/* Header */}
          <h1
            className="font-semibold text-[var(--text-primary)] tracking-tight mb-5"
            style={{ fontSize: 'var(--text-page-title)' }}
          >
            Travel Stats
          </h1>

          {/* World Map */}
          <WorldMap visitedContinents={stats.continentsVisited} countriesCount={stats.countriesVisited.length} />

          {/* Empty state message */}
          {stats.tripsCompleted === 0 && (
            <p className="text-center text-[var(--text-secondary)] mt-4" style={{ fontSize: 'var(--text-body-sm)' }}>
              Complete your first trip to start tracking stats!
            </p>
          )}

          {/* Cities & Trips — two-column cards */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <CircleStatCard icon={<Building size={18} className="text-[var(--lavender)]" strokeWidth={2.2} />} value={stats.citiesVisited.length} label="CITIES" />
            <CircleStatCard icon={<Briefcase size={18} className="text-[var(--lavender)]" strokeWidth={2.2} />} value={stats.tripsCompleted} label="TRIPS" />
          </div>

          {/* Top Destination Photo Card */}
          {stats.topDestination && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--salmon-tint)' }}
                >
                  <Star size={16} className="text-[var(--salmon)]" strokeWidth={2.2} />
                </div>
                <span
                  className="font-semibold text-[var(--text-primary)]"
                  style={{ fontSize: 'var(--text-section-title)' }}
                >
                  Top Destination
                </span>
              </div>

              <div
                className="relative overflow-hidden"
                style={{ borderRadius: 14, height: 180 }}
              >
                {/* Photo or gradient fallback */}
                {topPhoto ? (
                  <img
                    src={topPhoto.url}
                    alt={stats.topDestination}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    className="dark-gradient-fallback"
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                )}

                {/* Dark gradient overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)',
                  }}
                />

                {/* Text content */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    right: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                      color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'var(--font-family)',
                      marginBottom: 4,
                    }}
                  >
                    Most Frequent Visit
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-section-title)',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-family)',
                      lineHeight: 1.2,
                    }}
                  >
                    {stats.topDestination}
                  </div>
                </div>

                {/* Trip count badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    backgroundColor: 'var(--salmon)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontFamily: 'var(--font-family)',
                    textTransform: 'uppercase',
                  }}
                >
                  {stats.topDestinationTripCount} TRIP{stats.topDestinationTripCount !== 1 ? 'S' : ''}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Circle stat card for Countries/Continents
function CircleStatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{
        padding: 20,
        borderRadius: 14,
        backgroundColor: 'var(--blue-tint)',
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: 'var(--blue-tint)',
          border: '2px solid var(--blue-pale)',
        }}
      >
        {icon}
      </div>
      <span
        className="font-semibold text-[var(--text-primary)]"
        style={{ fontSize: 'var(--text-hero)', lineHeight: 1 }}
      >
        {value}
      </span>
      <span
        className="font-semibold text-[var(--text-secondary)]"
        style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}
      >
        {label}
      </span>
    </div>
  );
}

