import { useState } from 'react';
import { Backpack, Map, Compass, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface OnboardingPageProps {
  onComplete: () => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [page, setPage] = useState(0);

  const handleNext = () => {
    if (page < 1) {
      setPage(page + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)]">
      {/* Skip */}
      <div className="flex justify-end px-5 pt-3">
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
          <div className="flex flex-col items-center justify-center h-full px-5 gap-6">
            <div className="w-36 h-36 flex items-center justify-center rounded-[14px]"
              style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 15%, transparent)' }}>
              <Backpack size={80} className="text-[var(--lavender)]" />
            </div>
            <div className="text-center">
              <h1 className="text-[32px] font-semibold text-[var(--text-primary)] tracking-tight leading-tight">
                Every trip starts{'\n'}with a good list
              </h1>
              <p className="text-[16px] text-[var(--text-secondary)] mt-3 px-8">
                readiLi builds a packing list tailored to where you're going and what you're doing.
              </p>
            </div>
          </div>
        )}

        {page === 1 && (
          <div className="flex flex-col items-center justify-center h-full px-5 gap-8">
            <h2 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight">
              How it works
            </h2>
            <Card className="w-full max-w-sm p-4">
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
      </div>

      {/* Dots + Next */}
      <div className="px-5 pb-12 pt-4 flex flex-col items-center gap-5">
        <div className="flex gap-2">
          {[0, 1].map(i => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === page ? 'w-5 bg-[var(--lavender)]' : 'w-2 bg-[var(--border)]'
              }`}
            />
          ))}
        </div>
        <div className="w-full max-w-sm">
          <Button onClick={handleNext}>
            {page < 1 ? 'Next' : 'Get Started'}
          </Button>
        </div>
      </div>
    </div>
  );
}
