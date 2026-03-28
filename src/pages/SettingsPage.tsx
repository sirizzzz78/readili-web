import { useState } from 'react';
import { Shirt, Droplet, Scissors, Sparkles, Eye, Palette } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';

const STYLE_OPTIONS: { value: 'none' | 'masculine' | 'feminine'; label: string; icon: typeof Shirt }[] = [
  { value: 'none', label: 'Neutral', icon: Shirt },
  { value: 'masculine', label: 'Masculine', icon: Shirt },
  { value: 'feminine', label: 'Feminine', icon: Shirt },
];

const CARE_TOGGLES: { key: string; lsKey: string; title: string; subtitle: string; icon: typeof Droplet; iconColor: string }[] = [
  { key: 'menstrualCare', lsKey: 'readiLi.menstrualCare', title: 'Menstrual Care', subtitle: 'Pads, tampons, or cup', icon: Droplet, iconColor: 'var(--lavender)' },
  { key: 'groomingKit', lsKey: 'readiLi.groomingKit', title: 'Shaving / Grooming', subtitle: 'Razor, shaving cream, trimmer', icon: Scissors, iconColor: 'var(--lavender)' },
  { key: 'hairStyling', lsKey: 'readiLi.hairStyling', title: 'Hair Styling', subtitle: 'Dryer, straightener, products', icon: Sparkles, iconColor: 'var(--lavender)' },
  { key: 'contactLens', lsKey: 'readiLi.contactLens', title: 'Contact Lenses', subtitle: 'Solution, case, spare pair', icon: Eye, iconColor: 'var(--lavender)' },
  { key: 'makeup', lsKey: 'readiLi.makeup', title: 'Makeup', subtitle: 'Foundation, brushes, essentials', icon: Palette, iconColor: 'var(--lavender)' },
];

function getBottomsSplitLabel(ratio: number): string {
  const sample = 4;
  const skirtsQty = Math.round(sample * ratio / 100);
  const pantsQty = sample - skirtsQty;
  if (skirtsQty === 0) return 'All Pants';
  if (pantsQty === 0) return 'All Skirts';
  return `${pantsQty} Pants, ${skirtsQty} ${skirtsQty === 1 ? 'Skirt' : 'Skirts'}`;
}

export function SettingsPage() {
  const [gender, setGender] = useState<'none' | 'masculine' | 'feminine'>(
    () => (localStorage.getItem('readiLi.genderPref') as 'none' | 'masculine' | 'feminine') || 'none'
  );
  const [skirtsRatio, setSkirtsRatio] = useState(
    () => Number(localStorage.getItem('readiLi.skirtsRatio') ?? '0')
  );
  const [careToggles, setCareToggles] = useState(() => {
    const state: Record<string, boolean> = {};
    for (const t of CARE_TOGGLES) {
      state[t.key] = localStorage.getItem(t.lsKey) === 'true';
    }
    return state;
  });

  const handleGenderChange = (value: 'none' | 'masculine' | 'feminine') => {
    setGender(value);
    localStorage.setItem('readiLi.genderPref', value);
    // Auto-set slider default
    setSkirtsRatio(50);
    localStorage.setItem('readiLi.skirtsRatio', '50');
  };

  const handleSliderChange = (val: number) => {
    // Snap to 25% increments
    const snapped = Math.round(val / 25) * 25;
    setSkirtsRatio(snapped);
    localStorage.setItem('readiLi.skirtsRatio', String(snapped));
  };

  const handleToggle = (key: string, lsKey: string, val: boolean) => {
    setCareToggles(prev => ({ ...prev, [key]: val }));
    localStorage.setItem(lsKey, String(val));
  };

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--home-bg)', padding: '0 var(--page-px) 2rem' }}>
      {/* Hero */}
      <div style={{ paddingTop: '2rem', paddingBottom: '1.5rem' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-1.5">
          Tailored Transit
        </p>
        <h1
          className="font-semibold text-[var(--text-primary)] tracking-tight"
          style={{ fontSize: 'var(--text-page-title)' }}
        >
          Your Style, Your Journey.
        </h1>
        <p className="text-[var(--text-secondary)] mt-1" style={{ fontSize: 'var(--text-body-sm)' }}>
          We use these preferences to personalize every packing list.
        </p>
      </div>

      {/* Clothing Style Profile */}
      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-2.5">
        Clothing Style Profile
      </p>
      <Card>
        <div className="flex flex-col gap-1">
          {STYLE_OPTIONS.map(opt => {
            const selected = gender === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => handleGenderChange(opt.value)}
                className={`touch-none flex items-center gap-3 py-2 px-4 rounded-[10px] transition-colors ${
                  selected
                    ? 'bg-[var(--lavender)] text-white'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                <Icon size={18} className={selected ? 'text-white' : 'text-[var(--lavender)]'} />
                <span className="text-[15px] font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Card>
      <p className="text-[12px] text-[var(--text-secondary)] mt-2 px-1">
        This helps us tailor your clothing suggestions.
      </p>

      {/* Bottoms Mix */}
      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-2.5 mt-7">
        Bottoms Mix
      </p>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-medium text-[var(--text-primary)]">Pants</span>
          <span className="text-[15px] font-medium text-[var(--text-primary)]">Skirts</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={25}
          value={skirtsRatio}
          onChange={e => handleSliderChange(Number(e.target.value))}
          className="rewear-slider w-full"
        />
        {/* Tick marks */}
        <div className="flex justify-between mt-1 px-0.5">
          {[0, 25, 50, 75, 100].map(v => (
            <div
              key={v}
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{ backgroundColor: v <= skirtsRatio ? 'var(--lavender)' : 'var(--border)' }}
            />
          ))}
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] text-center mt-3">
          {getBottomsSplitLabel(skirtsRatio)}
        </p>
      </Card>

      {/* Personal Care Needs */}
      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-2.5 mt-7">
        Personal Care Needs
      </p>
      <Card>
        {CARE_TOGGLES.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={t.key}>
              {i > 0 && <div className="border-t border-[var(--border)] ml-[52px]" />}
              <div className="flex items-center gap-3 py-2.5">
                <div
                  className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in srgb, ${t.iconColor} 12%, transparent)` }}
                >
                  <Icon size={16} style={{ color: t.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-medium text-[var(--text-primary)]">{t.title}</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">{t.subtitle}</p>
                </div>
                <Toggle
                  checked={careToggles[t.key]}
                  onChange={val => handleToggle(t.key, t.lsKey, val)}
                />
              </div>
            </div>
          );
        })}
      </Card>

      <p className="text-[12px] text-[var(--text-secondary)] mt-3 px-1">
        Applies to new trips only.
      </p>

      {/* About */}
      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)] mb-2 mt-8">
        About
      </p>
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-[var(--text-primary)]">Version</span>
          <span className="text-[15px] text-[var(--text-secondary)]">1.0</span>
        </div>
      </Card>
    </div>
  );
}
