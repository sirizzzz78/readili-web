import type { Trip, PackingItem } from '../db/models';
import { countryToContinentMap } from './countryToContinentMap';

export interface ParsedDestination {
  city: string;
  country: string;
}

export interface TravelStats {
  countriesVisited: string[];
  continentsVisited: string[];
  citiesVisited: string[];
  tripsCompleted: number;
  totalItemsPacked: number;
  topDestination: string | null;
  topDestinationFullName: string | null;
  topDestinationTripCount: number;
  totalItems: number;
  efficiencyPercent: number;
  citiesPerContinent: Record<string, number>;
}

const COUNTRY_ALIASES: Record<string, string> = {
  'USA': 'United States',
  'US': 'United States',
  'UK': 'United Kingdom',
  'England': 'United Kingdom',
  'Scotland': 'United Kingdom',
  'Wales': 'United Kingdom',
  'Holland': 'Netherlands',
  'Czechia': 'Czech Republic',
  'Korea': 'South Korea',
  'Macau': 'Macao',
  'UAE': 'United Arab Emirates',
};

function normalizeCountry(raw: string): string {
  const trimmed = raw.trim();
  return COUNTRY_ALIASES[trimmed] ?? trimmed;
}

export function parseDestination(dest: string): ParsedDestination {
  const parts = dest.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      city: parts[0],
      country: normalizeCountry(parts[parts.length - 1]),
    };
  }
  return { city: parts[0] || dest.trim(), country: 'Unknown' };
}

function isCompletedTrip(trip: Trip): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(trip.endDate) < today;
}

export function computeTravelStats(
  trips: Trip[],
  allItems: Record<string, PackingItem[]>,
): TravelStats {
  const pastTrips = trips.filter(isCompletedTrip);

  const countrySet = new Set<string>();
  const citySet = new Set<string>();
  const countryCounts: Record<string, number> = {};
  const continentCities: Record<string, Set<string>> = {};

  for (const trip of pastTrips) {
    const { city, country } = parseDestination(trip.destination);

    if (country !== 'Unknown') {
      countrySet.add(country);
      countryCounts[country] = (countryCounts[country] ?? 0) + 1;
    }

    if (city) citySet.add(city);

    const continent = countryToContinentMap[country] ?? null;
    if (continent && city) {
      if (!continentCities[continent]) continentCities[continent] = new Set();
      continentCities[continent].add(city);
    }
  }

  const continentSet = new Set<string>();
  for (const country of countrySet) {
    const continent = countryToContinentMap[country];
    if (continent) continentSet.add(continent);
  }

  // Top destination = most-visited country
  let topDestination: string | null = null;
  let topDestinationFullName: string | null = null;
  let topCount = 0;
  for (const [country, count] of Object.entries(countryCounts)) {
    if (count > topCount) {
      topCount = count;
      topDestination = country;
    }
  }

  // Find full destination string for the top country
  if (topDestination) {
    for (const trip of pastTrips) {
      const { country } = parseDestination(trip.destination);
      if (country === topDestination) {
        topDestinationFullName = trip.destination;
        break;
      }
    }
  }

  // Total items & packed items across past trips
  let totalItemsPacked = 0;
  let totalItems = 0;
  for (const trip of pastTrips) {
    const items = allItems[trip.id] ?? [];
    totalItems += items.length;
    totalItemsPacked += items.filter(i => i.isPacked).length;
  }

  const efficiencyPercent = totalItems > 0 ? Math.round(totalItemsPacked / totalItems * 100) : 0;

  // Cities per continent (include all 7 continents)
  const allContinents = ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania', 'Antarctica'];
  const citiesPerContinent: Record<string, number> = {};
  for (const c of allContinents) {
    citiesPerContinent[c] = continentCities[c]?.size ?? 0;
  }

  return {
    countriesVisited: [...countrySet],
    continentsVisited: [...continentSet],
    citiesVisited: [...citySet],
    tripsCompleted: pastTrips.length,
    totalItemsPacked,
    topDestination,
    topDestinationFullName,
    topDestinationTripCount: topCount,
    totalItems,
    efficiencyPercent,
    citiesPerContinent,
  };
}
