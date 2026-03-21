import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, House, Globe, Plane, TrainFront, Car, PlaneTakeoff, PlaneLanding, Calendar, Clock, Repeat, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';
import { LucideIcon } from '../components/ui/LucideIcon';
import { LocationInput } from '../components/ui/LocationInput';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { ACTIVITY_LIST, EVENT_LIST, ALL_ACTIVITIES, TRANSPORTS } from '../lib/constants';
import { toISODate, addDays, getDatesInRange, formatMediumDate } from '../lib/dateUtils';
import { generatePackingList } from '../lib/packingCalculator';
import { fetchWeather } from '../lib/weatherService';
import { createTrip, getLearnedNewItems } from '../db/hooks';
import { db } from '../db/database';

export function TripSetupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // State for all steps
  const [destination, setDestination] = useState('');
  const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isInternational, setIsInternational] = useState(false);
  const [transportation, setTransportation] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [endDate, setEndDate] = useState(toISODate(addDays(new Date(), 7)));
  const [hasLaundry, setHasLaundry] = useState(false);
  const [laundryDates, setLaundryDates] = useState<Set<string>>(new Set());
  const [rewearDays, setRewearDays] = useState(1);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [generatedTripId, setGeneratedTripId] = useState<string | null>(null);

  const tripDays = Math.max(Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000), 1);
  const canProceed = step !== 1 || destination.trim().length > 0;
  const hasInput = destination.trim().length > 0 || selectedActivities.size > 0 || transportation.size > 0 || hasLaundry || rewearDays !== 1;

  // S1: Destination validation
  const destinationWarning = useMemo(() => {
    const trimmed = destination.trim();
    if (!trimmed) return '';
    if (trimmed.length < 3) return 'Destination seems too short';
    if (/^\d+$/.test(trimmed)) return 'Enter a city or country name';
    return '';
  }, [destination]);

  // S11: item count for completion screen
  const [generatedItemCount, setGeneratedItemCount] = useState(0);

  const handleClose = () => {
    if (hasInput) {
      setShowCloseConfirm(true);
    } else {
      navigate('/');
    }
  };

  const toggleTransport = (id: string) => {
    setTransportation(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleActivity = (id: string) => {
    setSelectedActivities(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLaundryDate = (date: string) => {
    setLaundryDates(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const tripData = {
        destination: destination.trim(),
        ...(destCoords ? { latitude: destCoords.latitude, longitude: destCoords.longitude } : {}),
        startDate,
        endDate,
        hasLaundry,
        laundryDates: [...laundryDates],
        rewearDays,
        activities: [...selectedActivities],
        isInternational,
        transportation: [...transportation],
        feedbackRating: 0,
        feedbackUnpacked: [] as string[],
        feedbackWishlist: '',
        hasSubmittedFeedback: false,
      };

      // Generate packing list without weather (instant)
      const drafts = generatePackingList(tripData, null);

      // Get learned items
      const learnedNew = await getLearnedNewItems(drafts.map(d => d.name));
      const allDrafts = [
        ...drafts,
        ...learnedNew.map(li => ({
          name: li.name,
          category: li.category,
          quantity: li.quantity,
          isMustPack: li.isMustPack,
        })),
      ];

      // Use placeholder tripId — createTrip will assign the real one
      const itemsToAdd = allDrafts.map(d => ({
        tripId: '', // will be set by createTrip
        name: d.name,
        category: d.category,
        quantity: d.quantity,
        isPacked: false,
        isMustPack: d.isMustPack,
        isAutoGenerated: true,
      }));

      // Atomic: trip + items created together in one transaction
      const trip = await createTrip(tripData, itemsToAdd);

      setGeneratedItemCount(itemsToAdd.length);
      setGeneratedTripId(trip.id);
      setShowCompletion(true);

      // Fetch weather in background and add weather-specific items
      fetchWeather(destination, startDate, endDate, undefined, destCoords ?? undefined).then(async (weather) => {
        if (!weather) return;
        const weatherDrafts = generatePackingList(tripData, weather);
        const currentItems = await db.packingItems.where('tripId').equals(trip.id).toArray();
        const currentNames = new Set(currentItems.map(i => i.name.toLowerCase()));
        const weatherOnlyItems = weatherDrafts
          .filter(d => !currentNames.has(d.name.toLowerCase()))
          .map(d => ({
            id: crypto.randomUUID(), tripId: trip.id, name: d.name, category: d.category,
            quantity: d.quantity, isPacked: false, isMustPack: d.isMustPack, isAutoGenerated: true,
          }));
        if (weatherOnlyItems.length > 0) {
          await db.packingItems.bulkAdd(weatherOnlyItems);
        }
      }).catch(() => {});
    } catch (e) {
      showToast('Something went wrong — please try again', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (showCompletion) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--background)] gap-6" style={{ padding: '0 var(--page-px)' }}>
        <CheckCircle2 size={72} className="text-[var(--salmon)]" />
        <div className="text-center">
          <h1 className="font-semibold text-[var(--text-primary)] tracking-tight" style={{ fontSize: 'var(--text-page-title)' }}>Ready to roll</h1>
          <p className="text-[var(--text-secondary)] mt-2" style={{ fontSize: 'var(--text-body)' }}>
            Your packing list for {destination} is ready.
          </p>
        </div>
        {/* S11: Trip summary */}
        <div className="w-full max-w-sm rounded-[14px] bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-2" style={{ padding: 'var(--card-px)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--text-secondary)]">Destination</span>
            <span className="text-[14px] font-medium text-[var(--text-primary)]">{destination}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--text-secondary)]">Dates</span>
            <span className="text-[14px] font-medium text-[var(--text-primary)]">{formatMediumDate(startDate)} – {formatMediumDate(endDate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--text-secondary)]">Items generated</span>
            <span className="text-[14px] font-medium text-[var(--text-primary)]">{generatedItemCount}</span>
          </div>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
          <Button onClick={() => navigate(`/trip/${generatedTripId}`)}>View Packing List</Button>
          <Button variant="ghost" onClick={() => navigate('/')}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '1rem var(--page-px) 0' }}>
        <button
          onClick={handleClose}
          aria-label="Close"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)]"
        >
          <X size={16} className="text-[var(--text-secondary)]" />
        </button>
        <span className="text-[17px] font-semibold text-[var(--text-primary)]">New Trip</span>
        <div className="w-9" />
      </div>

      {/* Progress bar + S12: step counter */}
      <div style={{ padding: '1.25rem var(--page-px) 0.5rem' }}>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i < step ? 'bg-[var(--lavender)]' : 'bg-[var(--border)]'
              }`}
            />
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-secondary)] text-center mt-2">Step {step} of {totalSteps}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <div style={{ padding: '1.5rem var(--page-px) 1.5rem' }}>
            <h2 className="font-semibold text-[var(--text-primary)]" style={{ fontSize: 'var(--text-page-title)' }}>Where are you headed?</h2>
            <p className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--text-body-sm)', marginTop: 'var(--step-heading-gap)' }}>Enter your destination city or country.</p>
            <div style={{ marginTop: 'var(--step-content-gap)' }}>
              <LocationInput value={destination} onChange={(v) => { setDestination(v); setDestCoords(null); }} onSelectCoords={(lat, lon) => setDestCoords({ latitude: lat, longitude: lon })} autoFocus />
            </div>
            {/* S1: Destination validation */}
            {destinationWarning && (
              <p className="flex items-center gap-1.5 text-[13px] text-[var(--salmon)] mt-2 px-1">
                <AlertTriangle size={13} /> {destinationWarning}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: '1.5rem var(--page-px) 1.5rem' }}>
            <h2 className="font-semibold text-[var(--text-primary)]" style={{ fontSize: 'var(--text-page-title)' }}>Tell us about your trip</h2>
            <p className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--text-body-sm)', marginTop: 'var(--step-heading-gap)' }}>We'll tailor your packing list to match.</p>

            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-1" style={{ marginTop: 'var(--step-content-gap)' }}>Trip type</p>
            <p className="text-[12px] text-[var(--text-secondary)] mb-2.5">Select one</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'domestic', label: 'Domestic', icon: <House size={15} />, selected: !isInternational },
                { id: 'international', label: 'International', icon: <Globe size={15} />, selected: isInternational },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setIsInternational(opt.id === 'international')}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-[15px] font-medium transition-colors ${
                    opt.selected
                      ? 'bg-[var(--lavender)] text-white'
                      : 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-1" style={{ marginTop: 'var(--step-content-gap)' }}>How are you getting there?</p>
            <p className="text-[12px] text-[var(--text-secondary)] mb-2.5">Select all that apply</p>
            <div className="grid grid-cols-3 gap-3">
              {TRANSPORTS.map(mode => {
                const selected = transportation.has(mode.id);
                const Icon = mode.id === 'Car' ? Car : mode.id === 'Train' ? TrainFront : Plane;
                return (
                  <button
                    key={mode.id}
                    onClick={() => toggleTransport(mode.id)}
                    className={`flex flex-col items-center gap-2 py-3.5 rounded-[12px] transition-colors ${
                      selected
                        ? 'bg-[var(--lavender)] text-white'
                        : 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]'
                    }`}
                  >
                    <Icon size={22} className={selected ? 'text-white' : 'text-[var(--lavender)]'} />
                    <span className="text-[13px] font-medium">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: '1.5rem var(--page-px) 1.5rem' }}>
            <h2 className="font-semibold text-[var(--text-primary)]" style={{ fontSize: 'var(--text-page-title)' }}>When are you traveling?</h2>
            <p className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--text-body-sm)', marginTop: 'var(--step-heading-gap)' }}>Pick your departure and return dates.</p>

            <div className="flex flex-col gap-3" style={{ marginTop: 'var(--step-content-gap)' }}>
              <Card>
                <div className="flex items-center gap-3">
                  <PlaneTakeoff size={18} className="text-[var(--lavender)] shrink-0" />
                  <span className="text-[15px] font-medium text-[var(--text-primary)]">Departure</span>
                  <span className="flex-1" />
                  <input
                    type="date"
                    value={startDate}
                    min={toISODate(new Date())}
                    onChange={e => {
                      setStartDate(e.target.value);
                      if (new Date(e.target.value) >= new Date(endDate)) {
                        setEndDate(toISODate(addDays(new Date(e.target.value), 1)));
                        showToast('Return date adjusted', 'info');
                      }
                    }}
                    className="bg-transparent text-[15px] text-[var(--lavender)] outline-none"
                  />
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <PlaneLanding size={18} className="text-[var(--lavender)] shrink-0" />
                  <span className="text-[15px] font-medium text-[var(--text-primary)]">Return</span>
                  <span className="flex-1" />
                  <input
                    type="date"
                    value={endDate}
                    min={toISODate(addDays(new Date(startDate), 1))}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-transparent text-[15px] text-[var(--lavender)] outline-none"
                  />
                </div>
              </Card>
            </div>

            <div className="flex justify-center mt-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-[14px] font-semibold text-[var(--lavender)]"
                style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 15%, transparent)' }}>
                <Calendar size={14} /> {tripDays} day{tripDays !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ padding: '1.5rem var(--page-px) 1.5rem' }}>
            <h2 className="font-semibold text-[var(--text-primary)]" style={{ fontSize: 'var(--text-page-title)' }}>Will you do laundry?</h2>
            <p className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--text-body-sm)', marginTop: 'var(--step-heading-gap)' }}>Pick the days you'll have access to laundry.</p>

            <Card style={{ marginTop: 'var(--step-content-gap)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LucideIcon name="washing-machine" size={18} className="text-[var(--salmon)]" />
                  <span className="text-[16px] font-medium text-[var(--text-primary)]">Access to laundry</span>
                </div>
                <Toggle checked={hasLaundry} onChange={val => { setHasLaundry(val); if (!val) setLaundryDates(new Set()); }} />
              </div>
            </Card>

            {hasLaundry && (
              <Card className="mt-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[15px] font-medium text-[var(--text-primary)]">Select laundry days</span>
                  {laundryDates.size > 0 && (
                    <span className="text-[13px] font-semibold text-[var(--lavender)] px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 15%, transparent)' }}>
                      {laundryDates.size} day{laundryDates.size !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getDatesInRange(startDate, endDate).map((date, idx) => {
                    const selected = laundryDates.has(date);
                    const d = new Date(date);
                    const showWeekSep = idx > 0 && idx % 7 === 0;
                    return (
                      <div key={date} className={`${showWeekSep ? 'border-t border-[var(--border)] pt-1' : ''} col-span-1`}>
                        <button
                          onClick={() => toggleLaundryDate(date)}
                          className={`w-full flex flex-col items-center py-2.5 rounded-lg text-center transition-colors ${
                            selected ? 'bg-[var(--lavender)] text-white' : 'hover:bg-[var(--border)]'
                          }`}
                        >
                          <span className="text-[10px]">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="text-[13px] font-semibold">{d.getDate()}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {step === 5 && (
          <div style={{ padding: '1.5rem var(--page-px) 1.5rem' }}>
            <h2 className="font-semibold text-[var(--text-primary)]" style={{ fontSize: 'var(--text-page-title)' }}>How many days per outfit?</h2>
            <p className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--text-body-sm)', marginTop: 'var(--step-heading-gap)' }}>Pack fewer outfits the more days you wear each one.</p>

            <Card style={{ marginTop: 'var(--step-content-gap)' }}>
              <div className="flex items-center gap-3 mb-5">
                <Repeat size={18} className="text-[var(--lavender)]" />
                <span className="text-[16px] font-medium text-[var(--text-primary)]">Days per outfit</span>
                <span className="flex-1" />
                <span className="text-[24px] font-bold text-[var(--lavender)]">{rewearDays}</span>
              </div>

              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={rewearDays}
                onChange={e => setRewearDays(Number(e.target.value))}
                className="rewear-slider w-full"
              />

              <div className="flex justify-between mt-2 px-0.5">
                {[1, 2, 3, 4, 5].map(d => (
                  <span
                    key={d}
                    className={`text-[12px] font-medium transition-colors ${
                      d === rewearDays ? 'text-[var(--lavender)]' : 'text-[var(--text-secondary)] opacity-50'
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </Card>

            <p className="text-[13px] text-[var(--text-secondary)] text-center mt-4">
              {rewearDays === 1 ? 'New outfit every day' : `1 outfit per ${rewearDays} days`}
            </p>
          </div>
        )}

        {step === 6 && (
          <div className="overflow-y-auto" style={{ padding: '1.5rem var(--page-px) 1rem' }}>
            <h2 className="font-semibold text-[var(--text-primary)]" style={{ fontSize: 'var(--text-page-title)' }}>What's on the agenda?</h2>
            <div className="flex items-center justify-between" style={{ marginTop: 'var(--step-heading-gap)' }}>
              <p className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--text-body-sm)' }}>Select all that apply.</p>
              {selectedActivities.size > 0 && (
                <span className="text-[13px] font-semibold text-[var(--lavender)] px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 15%, transparent)' }}>
                  {selectedActivities.size} selected
                </span>
              )}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-2.5" style={{ marginTop: 'var(--step-content-gap)' }}>Activities</p>
            <div className="grid grid-cols-3 gap-3">
              {ACTIVITY_LIST.map(act => {
                const selected = selectedActivities.has(act.id);
                return (
                  <button
                    key={act.id}
                    onClick={() => toggleActivity(act.id)}
                    className={`flex flex-col items-center gap-1.5 py-3.5 px-1 rounded-[12px] transition-colors ${
                      selected
                        ? 'bg-[var(--lavender)] text-white'
                        : 'bg-[var(--surface)] border border-[var(--border)]'
                    }`}
                  >
                    <LucideIcon name={act.icon} size={22} className={selected ? 'text-white' : 'text-[var(--lavender)]'} />
                    <span className={`text-[13px] font-medium leading-tight text-center ${selected ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                      {act.label}
                    </span>
                    <span className={`text-[10px] leading-tight text-center line-clamp-2 ${selected ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                      {act.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mt-6 mb-2.5">Events</p>
            <div className="grid grid-cols-3 gap-3">
              {EVENT_LIST.map(act => {
                const selected = selectedActivities.has(act.id);
                return (
                  <button
                    key={act.id}
                    onClick={() => toggleActivity(act.id)}
                    className={`flex flex-col items-center gap-1.5 py-3.5 px-1 rounded-[12px] transition-colors ${
                      selected
                        ? 'bg-[var(--lavender)] text-white'
                        : 'bg-[var(--surface)] border border-[var(--border)]'
                    }`}
                  >
                    <LucideIcon name={act.icon} size={22} className={selected ? 'text-white' : 'text-[var(--lavender)]'} />
                    <span className={`text-[13px] font-medium text-center ${selected ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                      {act.label}
                    </span>
                    <span className={`text-[10px] text-center line-clamp-2 ${selected ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                      {act.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* S10: Basics only note */}
      {step === totalSteps && selectedActivities.size === 0 && (
        <p className="text-[13px] text-[var(--text-secondary)] text-center px-6 pb-1">
          No activities selected — list will include basics only.
        </p>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3" style={{ padding: '0.5rem var(--page-px) 3rem' }}>
        {step > 1 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
        )}
        <Button
          onClick={step < totalSteps ? () => setStep(step + 1) : handleGenerate}
          disabled={!canProceed || isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Checking weather...
            </span>
          ) : step < totalSteps ? 'Next' : 'Generate List'}
        </Button>
      </div>

      <ConfirmDialog
        open={showCloseConfirm}
        title="Discard trip?"
        message="You have unsaved changes. Are you sure you want to leave?"
        confirmLabel="Discard"
        onConfirm={() => navigate('/')}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </div>
  );
}
