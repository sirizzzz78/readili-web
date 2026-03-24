import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Share, Pencil, Calendar } from 'lucide-react';
import { getFormattedDateRange } from '../../db/hooks';
import { getCachedPhoto, isPhotoCacheFresh, fetchDestinationPhoto, type PhotoResult } from '../../lib/destinationPhoto';
import { isBeforeToday } from '../../lib/dateUtils';
import type { Trip } from '../../db/models';

interface DestinationHeroProps {
  trip: Trip;
  packed: number;
  total: number;
  onBack: () => void;
  onShare: () => void;
  onEdit: () => void;
  weatherTemp?: string | null;
}

export function DestinationHero({ trip, packed, total, onBack, onShare, onEdit, weatherTemp }: DestinationHeroProps) {
  const [photo, setPhoto] = useState<PhotoResult | null>(null);
  const [photoLoaded, setPhotoLoaded] = useState(false);

  const progress = total > 0 ? packed / total : 0;
  const percentage = Math.round(progress * 100);
  const allPacked = packed === total && total > 0;

  const isPast = isBeforeToday(trip.endDate);

  const statusLabel = useMemo(() => {
    if (isPast) return 'COMPLETED';
    const start = new Date(trip.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (start <= today) return 'IN PROGRESS';
    return 'UPCOMING DESTINATION';
  }, [trip.startDate, trip.endDate, isPast]);

  // Load destination photo
  useEffect(() => {
    if (trip.destinationPhotoUrl) {
      setPhoto({ url: trip.destinationPhotoUrl, photographer: trip.destinationPhotoCredit || '', photographerUrl: '' });
      return;
    }

    const cached = getCachedPhoto(trip.destination);
    if (cached) {
      setPhoto(cached);
      if (isPhotoCacheFresh(trip.destination)) return;
    }

    const abortController = new AbortController();
    fetchDestinationPhoto(trip.destination, abortController.signal)
      .then(p => { if (!abortController.signal.aborted) setPhoto(p); })
      .catch(() => {});
    return () => abortController.abort();
  }, [trip.destination, trip.destinationPhotoUrl]);

  // Donut SVG params
  const donutSize = 60;
  const strokeWidth = 6;
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const fillColor = allPacked ? 'var(--salmon)' : 'var(--lavender)';

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', backgroundColor: 'var(--surface)' }}>
      {/* Photo / gradient background */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
        {photo ? (
          <img
            src={photo.url}
            alt={trip.destination}
            loading="lazy"
            onLoad={() => setPhotoLoaded(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: photoLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease',
              zIndex: 0,
            }}
          />
        ) : null}

        {/* Gradient fallback (always rendered behind photo) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: photo && photoLoaded ? -1 : 0,
          }}
          className="dark-gradient-fallback"
        />

        {/* Subtle darkening gradient (replaces wash overlay) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
          className="hero-darken-gradient"
        />

        {/* Nav buttons */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 3,
          }}
        >
          <button
            onClick={onBack}
            aria-label="Back to trips"
            className="hero-nav-btn"
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onShare} aria-label="Share packing list" className="hero-nav-btn">
              <Share size={16} />
            </button>
            <button onClick={onEdit} aria-label="Edit trip" className="hero-nav-btn">
              <Pencil size={16} />
            </button>
          </div>
        </div>

        {/* Frosted glass card — bottom */}
        <div
          className="hero-glass-card"
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 2,
            padding: 16,
            display: 'flex',
            gap: 12,
          }}
        >
          {/* Left content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Status label */}
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'var(--font-family)',
                marginBottom: 6,
              }}
            >
              {statusLabel}
            </div>

            {/* Destination name */}
            <h1
              style={{
                fontSize: 'var(--text-section-title)',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                fontFamily: 'var(--font-family)',
                lineHeight: 1.2,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {trip.destination}
            </h1>

            {/* Bottom row: dates + weather */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 8,
                fontSize: 13,
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'var(--font-family)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} />
                {getFormattedDateRange(trip.startDate, trip.endDate)}
              </div>
              {weatherTemp && (
                <span>{weatherTemp}</span>
              )}
            </div>
          </div>

          {/* Donut — right side of card */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width={donutSize} height={donutSize} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={radius}
                fill="none"
                stroke={fillColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s ease' }}
              />
              <text
                x={donutSize / 2}
                y={donutSize / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FFFFFF"
                fontSize="13"
                fontWeight="700"
                fontFamily="var(--font-family)"
                style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
              >
                {percentage}%
              </text>
            </svg>
          </div>
        </div>

        {/* Photo attribution */}
        {photo?.photographer && (
          <div
            style={{
              position: 'absolute',
              top: 52,
              right: 16,
              zIndex: 2,
              fontSize: 9,
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-family)',
            }}
          >
            Photo by{' '}
            {photo.photographerUrl ? (
              <a
                href={photo.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {photo.photographer}
              </a>
            ) : (
              photo.photographer
            )}{' '}
            on Pexels
          </div>
        )}
      </div>
    </div>
  );
}
