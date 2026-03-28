import { useState } from 'react';
import { Backpack, Map, Compass, CheckCircle2, Shirt } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface OnboardingPageProps {
  onComplete: () => void;
  onCustomize?: () => void;
}

export function OnboardingPage({ onComplete, onCustomize }: OnboardingPageProps) {
  const [page, setPage] = useState(0);

  const handleNext = () => {
    if (page < 2) {
      setPage(page + 1);
    } else {
      onComplete();
    }
  };

  const handleCustomize = () => {
    onComplete();
    onCustomize?.();
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)]">
      {/* Skip */}
      <div className="flex justify-end px-6 pt-3">
        <button
          onClick={onComplete}
          className="text-[15px] font-medium text-[var(--text-secondary)]"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {page === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6" style={{ padding: '0 var(--page-px)' }}>
            <div className="w-36 h-36 flex items-center justify-center rounded-[14px]"
              style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 15%, transparent)' }}>
              <Backpack size={80} className="text-[var(--lavender)]" />
            </div>
            <div className="text-center max-w-md">
              <h1 className="font-semibold text-[var(--text-primary)] tracking-tight leading-tight" style={{ fontSize: 'var(--text-hero)' }}>
                Every trip starts{'\n'}with a good list
              </h1>
              <p className="text-[var(--text-secondary)] mt-3 px-8" style={{ fontSize: 'var(--text-body)' }}>
                readiLi builds a packing list tailored to where you're going and what you're doing.
              </p>
            </div>
          </div>
        )}

        {page === 1 && (
          <div className="flex flex-col items-center justify-center h-full gap-8" style={{ padding: '0 var(--page-px)' }}>
            <h2 className="font-semibold text-[var(--text-primary)] tracking-tight" style={{ fontSize: 'var(--text-page-title)' }}>
              How it works
            </h2>
            <Card className="w-full max-w-sm">
              <div className="flex flex-col gap-5">
                {[
                  { icon: <Map size={26} className="text-[var(--lavender)]" />, title: 'Tell us about your trip', sub: 'Destination, dates, activities — the essentials.' },
                  { icon: <Compass size={26} className="text-[var(--lavender)]" />, title: 'We build your list', sub: 'A packing list matched to your itinerary and forecast.' },
                  { icon: <CheckCircle2 size={26} className="text-[var(--lavender)]" />, title: 'Check off as you go', sub: 'So nothing gets left behind on the dresser.' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-[14px]"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 15%, transparent)' }}>
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-[var(--text-primary)]">{step.title}</p>
                      <p className="text-[13px] text-[var(--text-secondary)]">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {page === 2 && (
          <div className="flex flex-col items-center justify-center h-full gap-6" style={{ padding: '0 var(--page-px)' }}>
            <div className="w-36 h-36 flex items-center justify-center rounded-[14px]"
              style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 15%, transparent)' }}>
              <Shirt size={80} className="text-[var(--lavender)]" />
            </div>
            <div className="text-center max-w-md">
              <h1 className="font-semibold text-[var(--text-primary)] tracking-tight leading-tight" style={{ fontSize: 'var(--text-hero)' }}>
                Make it yours
              </h1>
              <p className="text-[var(--text-secondary)] mt-3 px-4" style={{ fontSize: 'var(--text-body)' }}>
                Set your clothing style and personal care preferences — we'll tailor every list to you.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dots + Actions */}
      <div className="px-6 pb-12 pt-4 flex flex-col items-center gap-5">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-1 rounded-full transition-all duration-300 py-2 flex items-center ${
                i === page ? 'w-5' : 'w-2'
              }`}
            >
              <div className={`h-1 w-full rounded-full ${
                i === page ? 'bg-[var(--lavender)]' : 'bg-[var(--border)]'
              }`} />
            </button>
          ))}
        </div>
        <div className="w-full max-w-sm flex flex-col gap-3">
          {page < 2 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <>
              <Button onClick={handleCustomize}>Customize Now</Button>
              <button
                onClick={onComplete}
                className="text-[15px] font-medium text-[var(--text-secondary)] py-2"
              >
                Maybe Later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
