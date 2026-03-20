import { useState } from 'react';
import { Umbrella } from 'lucide-react';
import { Card } from '../ui/Card';
import { LucideIcon } from '../ui/LucideIcon';
import { weatherCondition, weatherIcon, type WeatherSummary } from '../../lib/weatherService';
import { dayOfWeek, dayOfMonth } from '../../lib/dateUtils';

interface WeatherCardProps {
  summary: WeatherSummary;
}

function symbolColor(code: number): string {
  // P4: sunny = amber, cloudy = secondary, rain = lavender, snow/storm = salmon
  if (code <= 1) return '#D4A020';   // amber for clear/sunny
  if (code <= 3) return 'var(--text-secondary)';
  if (code >= 51 && code <= 65) return 'var(--lavender)';
  if (code >= 71 && code <= 86) return 'var(--lavender)';
  if (code >= 95) return 'var(--salmon)';  // storms only
  return 'var(--text-secondary)';
}

function formatTemp(celsius: number, fahrenheit: boolean): string {
  if (fahrenheit) return `${Math.round(celsius * 9 / 5 + 32)}°F`;
  return `${Math.round(celsius)}°C`;
}

function detectDefaultUnit(): boolean {
  return typeof navigator !== 'undefined' &&
    (navigator.language?.startsWith('en-US') || Intl.DateTimeFormat().resolvedOptions().locale?.includes('US'));
}

export function WeatherCardComponent({ summary }: WeatherCardProps) {
  // P5: F/C toggle with auto-detect default
  const [fahrenheit, setFahrenheit] = useState(detectDefaultUnit);

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LucideIcon name={weatherIcon(summary.dominantWeatherCode)} size={13}
            className="text-[var(--lavender)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--blue-faint)]">
            Trip Forecast
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[var(--lavender)] px-2 py-0.5 rounded-[12px]"
            style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 12%, transparent)' }}>
            {weatherCondition(summary.dominantWeatherCode)}
          </span>
          <button
            onClick={() => setFahrenheit(f => !f)}
            aria-label={`Switch to ${fahrenheit ? 'Celsius' : 'Fahrenheit'}`}
            className="text-[12px] font-semibold text-[var(--lavender)] px-2 py-0.5 rounded-[12px] hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'color-mix(in srgb, var(--lavender) 12%, transparent)' }}
          >
            {fahrenheit ? '°C' : '°F'}
          </button>
        </div>
      </div>

      {/* Temps */}
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-end gap-0">
          <div>
            <p className="text-[30px] font-bold text-[var(--text-primary)] leading-none">
              {formatTemp(summary.avgHigh, fahrenheit)}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">avg high</p>
          </div>
          <span className="text-[20px] font-light text-[var(--text-secondary)] mx-1 pb-4"> / </span>
          <div>
            <p className="text-[20px] font-semibold text-[var(--text-secondary)] leading-none">
              {formatTemp(summary.avgLow, fahrenheit)}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">avg low</p>
          </div>
        </div>

        {summary.maxPrecipProb >= 20 && (
          <div className="flex flex-col items-center">
            <Umbrella size={20} className="text-[var(--lavender)]" />
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{summary.maxPrecipProb}%</p>
            <p className="text-[10px] text-[var(--text-secondary)]">rain</p>
          </div>
        )}
      </div>

      {/* Daily strip */}
      {summary.forecasts.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {summary.forecasts.map(day => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-[12px] bg-[var(--background)] min-w-[48px]"
            >
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{dayOfWeek(day.date)}</span>
              <span className="text-[10px] text-[var(--text-secondary)] opacity-70">{dayOfMonth(day.date)}</span>
              <LucideIcon name={weatherIcon(day.weatherCode)} size={16} className="my-0.5"
                style={{ color: symbolColor(day.weatherCode) } as any} />
              <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                {fahrenheit ? `${Math.round(day.high * 9 / 5 + 32)}°` : `${Math.round(day.high)}°`}
              </span>
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {fahrenheit ? `${Math.round(day.low * 9 / 5 + 32)}°` : `${Math.round(day.low)}°`}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
