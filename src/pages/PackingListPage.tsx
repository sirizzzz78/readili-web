import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Share, Pencil, Plus, PlusCircle, ChevronDown,
  Star, AlertCircle, BadgeCheck,
  Search, Loader2,
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useTrip, usePackingItems, deletePackingItem, getTripDays, getFormattedDateRange } from '../db/hooks';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SearchBar } from '../components/ui/SearchBar';
import { LucideIcon } from '../components/ui/LucideIcon';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AddItemSheet } from '../components/sheets/AddItemSheet';
import { EditItemSheet } from '../components/sheets/EditItemSheet';
import { EditTripSheet } from '../components/sheets/EditTripSheet';
import { WeatherCardComponent } from '../components/packingList/WeatherCard';
import { SuitcaseBackground } from '../components/packingList/SuitcaseBackground';
import { DestinationHero } from '../components/packingList/DestinationHero';
import { QuickStats } from '../components/packingList/QuickStats';
import { ItemRow } from '../components/packingList/ItemRow';
import { CATEGORY_ICONS } from '../lib/constants';
import { isRestricted } from '../lib/carryOnRules';
import { isBeforeToday } from '../lib/dateUtils';
import { fetchWeather, getCachedWeather, isWeatherCacheFresh, type WeatherSummary } from '../lib/weatherService';
import { getUnusedNames } from '../db/hooks';
import type { PackingItem } from '../db/models';

export function PackingListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const trip = useTrip(id);
  const items = usePackingItems(id);

  const { showToast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherOutOfRange, setWeatherOutOfRange] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  // Modals
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [addCategory, setAddCategory] = useState('');
  const [addAsMustPack, setAddAsMustPack] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const unusedNames = useMemo(() => getUnusedNames(), [items]);

  const isFlight = trip?.transportation.includes('Flight') ?? false;
  const isPast = trip ? isBeforeToday(trip.endDate) : false;

  const filteredItems = useMemo(() => {
    if (!searchText) return items;
    const q = searchText.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [items, searchText]);

  const mustPackItems = useMemo(() => filteredItems.filter(i => i.isMustPack), [filteredItems]);

  const groupedItems = useMemo(() => {
    const nonMustPack = filteredItems.filter(i => !i.isMustPack);
    const dict = new Map<string, PackingItem[]>();
    for (const item of nonMustPack) {
      const arr = dict.get(item.category) || [];
      arr.push(item);
      dict.set(item.category, arr);
    }
    const baseOrder = ['Essentials', 'Clothing', 'Toiletries', 'Health'];
    return [...dict.entries()].sort(([a], [b]) => {
      const ai = baseOrder.indexOf(a);
      const bi = baseOrder.indexOf(b);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [filteredItems]);

  const allCategories = useMemo(() => [...new Set(items.map(i => i.category))].sort(), [items]);
  const packed = items.filter(i => i.isPacked).length;
  const total = items.length;
  const progress = total > 0 ? packed / total : 0;
  const allPacked = packed === total && total > 0;

  const restrictedItems = useMemo(() =>
    isFlight ? items.filter(i => isRestricted(i.name)) : [],
    [items, isFlight]
  );

  // Auto-expand incomplete categories on first load (1.5 fix: added groupedItems dep)
  useEffect(() => {
    if (initialized || groupedItems.length === 0) return;
    const expanded = new Set<string>();
    for (const [cat, catItems] of groupedItems) {
      if (!catItems.every(i => i.isPacked)) expanded.add(cat);
    }
    setExpandedCategories(expanded);
    setInitialized(true);
  }, [groupedItems, initialized]);

  // Expand all on search (fix: added groupedItems dep)
  useEffect(() => {
    if (searchText) setExpandedCategories(new Set(groupedItems.map(([cat]) => cat)));
  }, [searchText, groupedItems]);

  // Load weather: show cached data immediately, refresh in background
  useEffect(() => {
    if (!trip) return;
    setWeatherOutOfRange(false);
    setWeatherError(false);

    // Show cached data instantly (stale-while-revalidate)
    const cached = getCachedWeather(trip.destination, trip.startDate, trip.endDate);
    if (cached) {
      setWeather(cached);
      setWeatherLoading(false);
      // If cache is fresh, skip network fetch
      if (isWeatherCacheFresh(trip.destination, trip.startDate, trip.endDate)) return;
    } else {
      setWeather(null);
      setWeatherLoading(true);
    }

    // Use stored coordinates if available
    const coords = trip.latitude && trip.longitude ? { latitude: trip.latitude, longitude: trip.longitude } : undefined;

    // Fetch fresh data in background
    const abortController = new AbortController();
    (async () => {
      try {
        const w = await fetchWeather(trip.destination, trip.startDate, trip.endDate, abortController.signal, coords);
        if (!abortController.signal.aborted) { setWeather(w); setWeatherLoading(false); }
      } catch (e: any) {
        if (abortController.signal.aborted) return;
        if (e?.message === 'outsideForecastWindow') {
          if (!cached) setWeatherOutOfRange(true);
        } else {
          if (!cached) setWeatherError(true);
        }
        setWeatherLoading(false);
      }
    })();
    return () => { abortController.abort(); };
  }, [trip?.destination, trip?.startDate, trip?.endDate]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const handleShare = useCallback(() => {
    if (!trip) return;
    let lines = [`Packing List: ${trip.destination}`, ''];
    const mp = items.filter(i => i.isMustPack);
    if (mp.length > 0) {
      lines.push('MUST PACK');
      mp.forEach(i => {
        const check = i.isPacked ? '[x]' : '[ ]';
        const qty = i.quantity > 1 ? ` (x${i.quantity})` : '';
        lines.push(`  ${check} ${i.name}${qty}`);
      });
      lines.push('');
    }
    for (const [cat, catItems] of groupedItems) {
      lines.push(cat.toUpperCase());
      catItems.forEach(i => {
        const check = i.isPacked ? '[x]' : '[ ]';
        const qty = i.quantity > 1 ? ` (x${i.quantity})` : '';
        lines.push(`  ${check} ${i.name}${qty}`);
      });
      lines.push('');
    }
    const text = lines.join('\n');
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    }
  }, [trip, items, groupedItems]);

  // undefined = still loading, null would mean not found, but useLiveQuery returns undefined for both
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    if (trip || !id) return;
    const timer = setTimeout(() => setLoadTimeout(true), 2000);
    return () => clearTimeout(timer);
  }, [trip, id]);

  if (!trip && loadTimeout) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--background)] gap-4" style={{ padding: '0 var(--page-px)' }}>
        <AlertCircle size={48} className="text-[var(--text-secondary)] opacity-50" />
        <h2 className="font-semibold text-[var(--text-primary)]" style={{ fontSize: 'var(--text-section-title)' }}>Trip not found</h2>
        <p className="text-[var(--text-secondary)] text-center" style={{ fontSize: 'var(--text-body)' }}>
          This trip may have been deleted or the link is invalid.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-8 py-5 rounded-[20px] bg-[var(--lavender)] text-white text-[16px] font-semibold"
        >
          Back to My Trips
        </button>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--background)]">
        <Loader2 size={24} className="animate-spin text-[var(--lavender)]" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh relative" style={{ backgroundColor: 'var(--home-bg)' }}>
      {/* Mountains + suitcase background at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 0 }}>
        <SuitcaseBackground />
      </div>

      <div className="relative z-[1] flex flex-col gap-5" style={{ padding: '0 var(--page-px) 340px' }}>
        {/* Hero card (photo + donut + trip info + nav) */}
        <DestinationHero
          trip={trip}
          packed={packed}
          total={total}
          onBack={() => navigate('/')}
          onShare={handleShare}
          onEdit={() => setShowEditTrip(true)}
        />

        {/* Archive banner */}
        {isPast && (
          <div className="flex items-center gap-3 p-5 rounded-[14px]"
            style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--lavender) 30%, transparent)' }}>
            <BadgeCheck size={20} className="text-[var(--lavender)] shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Trip completed</p>
              <p className="text-[12px] text-[var(--text-secondary)]">{packed} of {total} items packed · {getTripDays(trip.startDate, trip.endDate)} days</p>
            </div>
          </div>
        )}

        {/* Carry-on banner */}
        {restrictedItems.length > 0 && (
          <div className="flex items-center gap-3 p-5 rounded-[14px]"
            style={{ backgroundColor: 'color-mix(in srgb, var(--salmon) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--salmon) 25%, transparent)' }}>
            <LucideIcon name="plane" size={16} className="text-[var(--salmon)] shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                {restrictedItems.length} item{restrictedItems.length !== 1 ? 's' : ''} must go in your check-in bag
              </p>
              <p className="text-[12px] text-[var(--text-secondary)]">TSA restricts these from carry-on luggage.</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <QuickStats
          groupedItems={groupedItems}
          mustPackItems={mustPackItems}
          onScrollToCategory={(name) => {
            const el = document.getElementById(`category-${name}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // Expand the category if collapsed
              setExpandedCategories(prev => new Set([...prev, name]));
            }
          }}
        />

        {/* Weather */}
        {weather && <WeatherCardComponent summary={weather} />}
        {weatherOutOfRange && (
          <Card className="flex items-center gap-3">
            <LucideIcon name="cloud-sun" size={20} className="text-[var(--text-secondary)] opacity-50" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)]">Trip Forecast</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Forecast available closer to your trip.</p>
            </div>
          </Card>
        )}
        {weatherError && (
          <Card className="flex items-center gap-3">
            <LucideIcon name="cloud-off" size={20} className="text-[var(--text-secondary)] opacity-50" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)]">Trip Forecast</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Couldn't load forecast. Check your connection and try again.</p>
            </div>
          </Card>
        )}
        {weatherLoading && !weather && !weatherOutOfRange && (
          <Card className="flex items-center gap-3">
            <Loader2 size={16} className="animate-spin text-[var(--lavender)]" />
            <span className="text-[12px] text-[var(--text-secondary)]">Loading forecast...</span>
          </Card>
        )}

        {/* Search */}
        <SearchBar value={searchText} onChange={setSearchText} />

        {/* Must Pack */}
        {(mustPackItems.length > 0 || true) && (
          <div id="category-Must Pack">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] flex items-center gap-1">
                <Star size={11} /> Must Pack
              </span>
              <button
                onClick={() => { setAddAsMustPack(true); setAddCategory(''); setShowAddSheet(true); }}
                aria-label="Add must-pack item"
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 12%, transparent)' }}
              >
                <Plus size={14} className="text-[var(--lavender)]" />
              </button>
            </div>
            {mustPackItems.length > 0 && (
              <Card noPadding className="overflow-hidden">
                {mustPackItems.map((item, i) => (
                  <div key={item.id}>
                    <ItemRow
                      item={item}
                      isFlight={isFlight}
                      unusedNames={unusedNames}
                      onEdit={() => setEditingItem(item)}
                      onDelete={() => setDeleteTarget(item.id)}
                      isMustPack
                    />
                    {i < mustPackItems.length - 1 && <div className="border-b border-[var(--border)] ml-12" />}
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* Category sections */}
        {groupedItems.map(([category, catItems]) => {
          const catPacked = catItems.filter(i => i.isPacked).length;
          const catTotal = catItems.length;
          const catComplete = catPacked === catTotal && catTotal > 0;
          const isExpanded = expandedCategories.has(category);
          const catProgress = catTotal > 0 ? catPacked / catTotal : 0;
          const iconName = CATEGORY_ICONS[category] || 'tag';

          return (
            <div key={category} id={`category-${category}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 flex items-center justify-center rounded-[9px] ${catComplete ? 'bg-[var(--salmon-tint)]' : 'bg-[var(--blue-tint)]'}`}>
                  <LucideIcon name={iconName} size={13} className={catComplete ? 'text-[var(--salmon)]' : 'text-[var(--lavender)]'} />
                </div>
                <button onClick={() => toggleCategory(category)} className="flex-1 flex items-center gap-1">
                  <span className={`text-[12px] font-semibold uppercase tracking-[0.5px] ${catComplete ? 'text-[var(--salmon)]' : 'text-[var(--text-secondary)]'}`}>
                    {category}
                  </span>
                  <span className="flex-1" />
                  <span className={`text-[12px] font-medium ${catComplete ? 'text-[var(--salmon)]' : 'text-[var(--text-secondary)]'}`}>
                    {catPacked}/{catTotal}
                  </span>
                  <ChevronDown size={11} className={`text-[var(--text-secondary)] transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                </button>
                <button
                  onClick={() => { setAddAsMustPack(false); setAddCategory(category); setShowAddSheet(true); }}
                  aria-label={`Add item to ${category}`}
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 12%, transparent)' }}
                >
                  <Plus size={14} className="text-[var(--lavender)]" />
                </button>
              </div>

              <ProgressBar progress={catProgress} complete={catComplete} />

              {isExpanded && (
                <Card noPadding className="mt-2 overflow-hidden">
                  {catItems.length === 0 ? (
                    <p className="text-[12px] text-[var(--text-secondary)] p-4">No items here yet — tap + to add some</p>
                  ) : (
                    catItems.map((item, i) => (
                      <div key={item.id}>
                        <ItemRow
                          item={item}
                          isFlight={isFlight}
                          unusedNames={unusedNames}
                          onEdit={() => setEditingItem(item)}
                          onDelete={() => setDeleteTarget(item.id)}
                        />
                        {i < catItems.length - 1 && <div className="border-b border-[var(--border)] ml-12" />}
                      </div>
                    ))
                  )}
                </Card>
              )}
            </div>
          );
        })}

        {/* Add another item */}
        <button
          onClick={() => { setAddAsMustPack(false); setAddCategory(''); setShowAddSheet(true); }}
          className="flex items-center justify-center gap-2 py-5 rounded-[20px] text-[14px] font-semibold text-[var(--lavender)]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 8%, transparent)' }}
        >
          <PlusCircle size={16} /> Add another item
        </button>
      </div>

      {/* Modals */}
      <Modal open={showAddSheet} onClose={() => setShowAddSheet(false)} title={addAsMustPack ? 'Add Must-Pack Item' : 'Add Item'}>
        <AddItemSheet
          tripId={id!}
          existingCategories={allCategories}
          preselectedCategory={addCategory}
          isMustPack={addAsMustPack}
          onClose={() => setShowAddSheet(false)}
        />
      </Modal>

      {editingItem && (
        <Modal open={true} onClose={() => setEditingItem(null)} title="Edit Item">
          <EditItemSheet
            item={editingItem}
            existingCategories={allCategories}
            onClose={() => setEditingItem(null)}
          />
        </Modal>
      )}

      <Modal open={showEditTrip} onClose={() => setShowEditTrip(false)} title="Edit Trip">
        <EditTripSheet trip={trip} onClose={() => setShowEditTrip(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item?"
        message="This item will be removed from your packing list."
        onConfirm={() => {
          const targetId = deleteTarget;
          setDeleteTarget(null);
          if (targetId) {
            deletePackingItem(targetId)
              .then(() => showToast('Item deleted', 'success'))
              .catch(() => showToast('Failed to delete item', 'info'));
          }
        }}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}
