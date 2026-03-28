import { describe, it, expect } from 'vitest';
import { generatePackingList, type PackingItemDraft } from '../packingCalculator';
import type { WeatherSummary } from '../weatherService';

function makeTrip(overrides: Partial<Parameters<typeof generatePackingList>[0]> = {}) {
  return {
    destination: 'Test City',
    startDate: '2026-04-01',
    endDate: '2026-04-08', // 7 days
    hasLaundry: false,
    laundryDates: [],
    rewearDays: 1,
    activities: [],
    isInternational: false,
    transportation: [],
    ...overrides,
  };
}

function findItem(items: PackingItemDraft[], name: string) {
  return items.find(i => i.name.toLowerCase() === name.toLowerCase());
}

function hasItem(items: PackingItemDraft[], name: string) {
  return items.some(i => i.name.toLowerCase() === name.toLowerCase());
}

describe('generatePackingList', () => {
  // ── Base items ──

  it('includes base items for a domestic trip', () => {
    const items = generatePackingList(makeTrip());
    expect(hasItem(items, 'Phone Charger')).toBe(true);
    expect(hasItem(items, 'Tops')).toBe(true);
    expect(hasItem(items, 'Pants')).toBe(true);
    expect(hasItem(items, 'Underwear')).toBe(true);
    expect(hasItem(items, 'Socks')).toBe(true);
    expect(hasItem(items, 'Pajamas')).toBe(true);
    expect(hasItem(items, 'Toothbrush & Toothpaste')).toBe(true);
    expect(hasItem(items, 'Deodorant')).toBe(true);
    expect(hasItem(items, 'Shampoo & Conditioner')).toBe(true);
    expect(hasItem(items, 'Prescription Medications')).toBe(true);
    expect(hasItem(items, "Driver's License / Real ID")).toBe(true);
  });

  it('includes Passport and Travel Adapter for international trip', () => {
    const items = generatePackingList(makeTrip({ isInternational: true }));
    expect(hasItem(items, 'Passport')).toBe(true);
    expect(hasItem(items, 'Travel Adapter')).toBe(true);
    expect(hasItem(items, "Driver's License / Real ID")).toBe(false);
  });

  // ── Outfit calculation ──

  it('calculates correct outfit quantity with no laundry (rewear=1)', () => {
    const items = generatePackingList(makeTrip()); // 7 days, rewear=1
    expect(findItem(items, 'Tops')?.quantity).toBe(7);
    expect(findItem(items, 'Underwear')?.quantity).toBe(7);
    expect(findItem(items, 'Socks')?.quantity).toBe(7);
    expect(findItem(items, 'Pants')?.quantity).toBe(4); // ceil(7/2)
  });

  it('reduces outfits with rewear > 1', () => {
    const items = generatePackingList(makeTrip({ rewearDays: 2 })); // 7 days, rewear=2 → ceil(7/2)=4
    expect(findItem(items, 'Tops')?.quantity).toBe(4);
    expect(findItem(items, 'Underwear')?.quantity).toBe(4);
  });

  it('reduces outfits with laundry mid-trip', () => {
    // 10-day trip, laundry on day 5 → longest stretch = max(5, 5) = 5
    const items = generatePackingList(makeTrip({
      startDate: '2026-04-01',
      endDate: '2026-04-11', // 10 days
      hasLaundry: true,
      laundryDates: ['2026-04-06'],
    }));
    expect(findItem(items, 'Tops')?.quantity).toBe(5);
  });

  // ── Transportation ──

  it('adds flight items', () => {
    const items = generatePackingList(makeTrip({ transportation: ['Flight'] }));
    expect(hasItem(items, 'Earbuds / Headphones')).toBe(true);
    expect(hasItem(items, 'Neck Pillow')).toBe(true);
    expect(hasItem(items, 'Eye Mask')).toBe(true);
    expect(hasItem(items, 'Snacks')).toBe(true);
  });

  it('adds car items', () => {
    const items = generatePackingList(makeTrip({ transportation: ['Car'] }));
    expect(hasItem(items, 'Car Charger')).toBe(true);
  });

  it('adds no extra items for train', () => {
    const base = generatePackingList(makeTrip());
    const withTrain = generatePackingList(makeTrip({ transportation: ['Train'] }));
    expect(withTrain.length).toBe(base.length);
  });

  // ── Activities ──

  it('adds Beach items', () => {
    const items = generatePackingList(makeTrip({ activities: ['Beach'] }));
    expect(hasItem(items, 'Swimsuit')).toBe(true);
    expect(hasItem(items, 'Flip Flops / Sandals')).toBe(true);
    expect(hasItem(items, 'Sun Hat')).toBe(true);
    expect(hasItem(items, 'Sunscreen')).toBe(true);
    expect(hasItem(items, 'Beach Towel')).toBe(true);
  });

  it('adds Hiking items with outfit-scaled quantities', () => {
    const items = generatePackingList(makeTrip({ activities: ['Hiking'] })); // 7 outfits
    expect(hasItem(items, 'Hiking Boots')).toBe(true);
    expect(findItem(items, 'Moisture-Wicking Shirts')?.quantity).toBe(7);
    expect(hasItem(items, 'Trekking Poles')).toBe(true);
  });

  it('adds Business items with outfit-scaled quantities', () => {
    const items = generatePackingList(makeTrip({ activities: ['Business'] }));
    expect(findItem(items, 'Dress Shirts / Blouses')?.quantity).toBe(7);
    expect(hasItem(items, 'Blazer')).toBe(true);
    expect(hasItem(items, 'Dress Shoes')).toBe(true);
  });

  it('adds Camping items (large set)', () => {
    const items = generatePackingList(makeTrip({ activities: ['Camping'] }));
    expect(hasItem(items, 'Tent')).toBe(true);
    expect(hasItem(items, 'Sleeping Bag')).toBe(true);
    expect(hasItem(items, 'Camp Stove')).toBe(true);
    expect(hasItem(items, 'Fire Starter')).toBe(true);
    expect(hasItem(items, 'Knife / Multi-tool')).toBe(true);
  });

  it('includes items from multiple activities', () => {
    const items = generatePackingList(makeTrip({ activities: ['Beach', 'Hiking'] }));
    expect(hasItem(items, 'Swimsuit')).toBe(true);
    expect(hasItem(items, 'Hiking Boots')).toBe(true);
  });

  // ── Weather ──

  it('adds rain items when forecasts include rain codes', () => {
    const weather: WeatherSummary = {
      avgHigh: 20, avgLow: 15, maxPrecipProb: 80, dominantWeatherCode: 63,
      forecasts: [{ date: '2026-04-01', high: 20, low: 15, precipProbability: 80, weatherCode: 63 }],
    };
    const items = generatePackingList(makeTrip(), weather);
    expect(hasItem(items, 'Rain Jacket')).toBe(true);
    expect(hasItem(items, 'Umbrella')).toBe(true);
    expect(hasItem(items, 'Waterproof Bag')).toBe(true);
  });

  it('adds snow items when forecasts include snow codes', () => {
    const weather: WeatherSummary = {
      avgHigh: -2, avgLow: -10, maxPrecipProb: 60, dominantWeatherCode: 73,
      forecasts: [{ date: '2026-04-01', high: -2, low: -10, precipProbability: 60, weatherCode: 73 }],
    };
    const items = generatePackingList(makeTrip(), weather);
    expect(hasItem(items, 'Winter Coat')).toBe(true);
    expect(hasItem(items, 'Warm Gloves')).toBe(true);
    expect(hasItem(items, 'Beanie / Winter Hat')).toBe(true);
    expect(hasItem(items, 'Thermal Underwear')).toBe(true);
    expect(hasItem(items, 'Waterproof Boots')).toBe(true);
  });

  it('adds hot weather items when avgHigh > 85°F', () => {
    // avgHigh in Celsius: (85°F - 32) * 5/9 ≈ 29.44°C → use 30
    const weather: WeatherSummary = {
      avgHigh: 35, avgLow: 25, maxPrecipProb: 10, dominantWeatherCode: 0,
      forecasts: [{ date: '2026-04-01', high: 35, low: 25, precipProbability: 10, weatherCode: 0 }],
    };
    const items = generatePackingList(makeTrip(), weather);
    expect(hasItem(items, 'Sunscreen')).toBe(true);
    expect(hasItem(items, 'Sunglasses')).toBe(true);
    expect(hasItem(items, 'Sun Hat')).toBe(true);
    expect(hasItem(items, 'Light / Breathable Clothing')).toBe(true);
    expect(hasItem(items, 'Water Bottle')).toBe(true);
  });

  it('adds cold weather items when avgLow < 40°F (no snow)', () => {
    // avgLow in Celsius: (40°F - 32) * 5/9 ≈ 4.44°C → use 0
    const weather: WeatherSummary = {
      avgHigh: 5, avgLow: 0, maxPrecipProb: 10, dominantWeatherCode: 0,
      forecasts: [{ date: '2026-04-01', high: 5, low: 0, precipProbability: 10, weatherCode: 0 }],
    };
    const items = generatePackingList(makeTrip(), weather);
    expect(hasItem(items, 'Heavy Jacket')).toBe(true);
    expect(hasItem(items, 'Warm Gloves')).toBe(true);
    expect(hasItem(items, 'Beanie / Winter Hat')).toBe(true);
    expect(hasItem(items, 'Scarf')).toBe(true);
  });

  it('adds Light Jacket for mild weather', () => {
    // avgLow > 55°F and avgHigh < 85°F → mild
    // avgLow=15°C → 59°F, avgHigh=25°C → 77°F
    const weather: WeatherSummary = {
      avgHigh: 25, avgLow: 15, maxPrecipProb: 10, dominantWeatherCode: 0,
      forecasts: [{ date: '2026-04-01', high: 25, low: 15, precipProbability: 10, weatherCode: 0 }],
    };
    const items = generatePackingList(makeTrip(), weather);
    expect(hasItem(items, 'Light Jacket')).toBe(true);
    expect(hasItem(items, 'Heavy Jacket')).toBe(false);
  });

  // ── Deduplication ──

  it('deduplicates items by name (case insensitive)', () => {
    // Beach and Hiking both add Sunglasses
    const items = generatePackingList(makeTrip({ activities: ['Beach', 'Hiking'] }));
    const sunglasses = items.filter(i => i.name.toLowerCase() === 'sunglasses');
    expect(sunglasses).toHaveLength(1);
  });

  it('preserves mustPack=true during dedup', () => {
    // Phone Charger is mustPack=true in base items
    // If another source added Phone Charger with mustPack=false, the true should win
    const items = generatePackingList(makeTrip());
    expect(findItem(items, 'Phone Charger')?.isMustPack).toBe(true);
  });

  it('keeps higher quantity during dedup', () => {
    // Beach adds Swimsuit×1, Swimming adds Swimsuit×2
    const items = generatePackingList(makeTrip({ activities: ['Beach', 'Swimming'] }));
    expect(findItem(items, 'Swimsuit')?.quantity).toBe(2);
  });

  // ── Edge cases ──

  it('handles empty activities without crashing', () => {
    const items = generatePackingList(makeTrip({ activities: [] }));
    expect(items.length).toBeGreaterThan(0); // still has base items
  });

  it('handles no weather data', () => {
    const items = generatePackingList(makeTrip());
    // Should not include weather-specific items
    expect(hasItem(items, 'Rain Jacket')).toBe(false);
    expect(hasItem(items, 'Winter Coat')).toBe(false);
  });
});
