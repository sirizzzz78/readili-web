import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { Card } from './Card';
import { searchLocations, formatLocation, type LocationResult } from '../../lib/locationSearch';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCoords?: (lat: number, lon: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function LocationInput({ value, onChange, onSelectCoords, placeholder = 'e.g. Tokyo, Japan', autoFocus }: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchLocations(query);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setHighlightIndex(-1);
    }, 300);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    fetchSuggestions(val);
  };

  const handleSelect = (loc: LocationResult) => {
    onChange(formatLocation(loc));
    onSelectCoords?.(loc.latitude, loc.longitude);
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Card className="flex items-center gap-3">
        <MapPin size={18} className="text-[var(--lavender)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[16px] text-[var(--text-primary)] outline-none"
          autoFocus={autoFocus}
          autoComplete="off"
        />
      </Card>
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
          {suggestions.map((loc, i) => (
            <button
              key={`${loc.latitude}-${loc.longitude}`}
              onClick={() => handleSelect(loc)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                i === highlightIndex ? 'bg-[var(--lavender)] bg-opacity-10' : 'hover:bg-[var(--border)] hover:bg-opacity-30'
              } ${i > 0 ? 'border-t border-[var(--border)] border-opacity-50' : ''}`}
            >
              <MapPin size={14} className="text-[var(--text-secondary)] shrink-0" />
              <div>
                <span className="text-[15px] font-medium text-[var(--text-primary)]">{loc.name}</span>
                {(loc.admin1 || loc.country) && (
                  <span className="text-[13px] text-[var(--text-secondary)] ml-1">
                    {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
