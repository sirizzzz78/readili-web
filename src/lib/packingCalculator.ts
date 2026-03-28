import type { WeatherSummary } from './weatherService';

export interface PackingItemDraft {
  name: string;
  category: string;
  quantity: number;
  isMustPack: boolean;
}

export interface ClothingPreferences {
  gender: 'none' | 'masculine' | 'feminine';
  skirtsRatio: number;
  menstrualCare: boolean;
  groomingKit: boolean;
  hairStyling: boolean;
  contactLens: boolean;
  makeup: boolean;
}

export function getClothingPreferences(): ClothingPreferences {
  return {
    gender: (localStorage.getItem('readiLi.genderPref') as ClothingPreferences['gender']) || 'none',
    skirtsRatio: Number(localStorage.getItem('readiLi.skirtsRatio') ?? '0'),
    menstrualCare: localStorage.getItem('readiLi.menstrualCare') === 'true',
    groomingKit: localStorage.getItem('readiLi.groomingKit') === 'true',
    hairStyling: localStorage.getItem('readiLi.hairStyling') === 'true',
    contactLens: localStorage.getItem('readiLi.contactLens') === 'true',
    makeup: localStorage.getItem('readiLi.makeup') === 'true',
  };
}

export function generatePackingList(
  trip: {
    destination: string;
    startDate: string;
    endDate: string;
    hasLaundry: boolean;
    laundryDates: string[];
    rewearDays: number;
    activities: string[];
    isInternational: boolean;
    transportation: string[];
  },
  weather?: WeatherSummary | null,
  preferences?: ClothingPreferences
): PackingItemDraft[] {
  const prefs = preferences ?? { gender: 'none', skirtsRatio: 0, menstrualCare: false, groomingKit: false, hairStyling: false, contactLens: false, makeup: false };
  let items: PackingItemDraft[] = [];

  const effectiveDays = getLongestStretch(trip);
  const rewear = Math.max(trip.rewearDays, 1);
  const outfits = Math.ceil(effectiveDays / rewear);

  // Base items
  const bottomsQty = Math.max(Math.ceil(outfits / 2), 1);
  items.push(
    { name: 'Phone Charger', category: 'Essentials', quantity: 1, isMustPack: true },
    { name: 'Portable Charger / Power Bank', category: 'Essentials', quantity: 1, isMustPack: false },
    { name: 'Tops', category: 'Clothing', quantity: outfits, isMustPack: false },
  );

  // Bottoms: preference-aware with skirts ratio slider
  {
    const skirtsQty = Math.round(bottomsQty * prefs.skirtsRatio / 100);
    const pantsQty = bottomsQty - skirtsQty;
    if (pantsQty > 0) items.push({ name: 'Pants', category: 'Clothing', quantity: pantsQty, isMustPack: false });
    if (skirtsQty > 0) items.push({ name: 'Skirts', category: 'Clothing', quantity: skirtsQty, isMustPack: false });
    if (pantsQty === 0 && skirtsQty === 0) items.push({ name: 'Pants', category: 'Clothing', quantity: 1, isMustPack: false });
  }

  items.push(
    { name: 'Underwear', category: 'Clothing', quantity: outfits, isMustPack: false },
    { name: 'Socks', category: 'Clothing', quantity: outfits, isMustPack: false },
    { name: 'Pajamas', category: 'Clothing', quantity: 1, isMustPack: false },
  );

  // Toiletries (broken out)
  items.push(
    { name: 'Toothbrush & Toothpaste', category: 'Toiletries', quantity: 1, isMustPack: false },
    { name: 'Deodorant', category: 'Toiletries', quantity: 1, isMustPack: false },
    { name: 'Shampoo & Conditioner', category: 'Toiletries', quantity: 1, isMustPack: false },
    { name: 'Body Wash / Soap', category: 'Toiletries', quantity: 1, isMustPack: false },
    { name: 'Lip Balm', category: 'Toiletries', quantity: 1, isMustPack: false },
    { name: 'Hair Brush / Comb', category: 'Toiletries', quantity: 1, isMustPack: false },
  );

  // Personal care toggle items (opt-in via Settings)
  if (prefs.menstrualCare) items.push({ name: 'Menstrual Care Products', category: 'Toiletries', quantity: 1, isMustPack: false });
  if (prefs.groomingKit) items.push({ name: 'Shaving / Grooming Kit', category: 'Toiletries', quantity: 1, isMustPack: false });
  if (prefs.hairStyling) items.push({ name: 'Hair Styling Tools', category: 'Toiletries', quantity: 1, isMustPack: false });
  if (prefs.contactLens) items.push({ name: 'Contact Lens Kit', category: 'Toiletries', quantity: 1, isMustPack: false });
  if (prefs.makeup) items.push({ name: 'Makeup Bag', category: 'Toiletries', quantity: 1, isMustPack: false });

  // Health
  items.push(
    { name: 'Prescription Medications', category: 'Health', quantity: 1, isMustPack: false },
    { name: 'Pain Relievers', category: 'Health', quantity: 1, isMustPack: false },
    { name: 'Band-Aids', category: 'Health', quantity: 1, isMustPack: false },
  );

  // International vs domestic
  if (trip.isInternational) {
    items.push(
      { name: 'Passport', category: 'Essentials', quantity: 1, isMustPack: true },
      { name: 'Travel Adapter', category: 'Essentials', quantity: 1, isMustPack: false },
    );
  } else {
    items.push(
      { name: 'Driver\'s License / Real ID', category: 'Essentials', quantity: 1, isMustPack: true },
    );
  }

  // Transportation
  for (const mode of trip.transportation) {
    switch (mode) {
      case 'Flight':
        items.push(
          { name: 'Earbuds / Headphones', category: 'Essentials', quantity: 1, isMustPack: false },
          { name: 'Neck Pillow', category: 'Essentials', quantity: 1, isMustPack: false },
          { name: 'Eye Mask', category: 'Essentials', quantity: 1, isMustPack: false },
          { name: 'Snacks', category: 'Essentials', quantity: 1, isMustPack: false },
        );
        break;
      case 'Car':
        items.push(
          { name: 'Car Charger', category: 'Essentials', quantity: 1, isMustPack: false },
        );
        break;
    }
  }

  // Activities
  for (const activity of trip.activities) {
    items.push(...getActivityItems(activity, outfits, prefs));
  }

  // Weather
  if (weather) {
    items.push(...getWeatherItems(weather));
  }

  return deduplicate(items);
}

function item(name: string, category: string, quantity = 1): PackingItemDraft {
  return { name, category, quantity, isMustPack: false };
}

function getActivityItems(activity: string, outfits: number, prefs: ClothingPreferences): PackingItemDraft[] {
  switch (activity) {
    case 'Sightseeing':
      return [
        item('Comfortable Walking Shoes', 'Sightseeing'),
        item('Day Bag / Backpack', 'Sightseeing'),
        item('Camera', 'Sightseeing'),
        item('Guidebook / Maps', 'Sightseeing'),
        item('Sunglasses', 'Sightseeing'),
        item('Water Bottle', 'Sightseeing'),
      ];
    case 'Beach':
      return [
        item('Swimsuit', 'Beach'),
        item('Flip Flops / Sandals', 'Beach'),
        item('Sun Hat', 'Beach'),
        item('Sunscreen', 'Beach'),
        item('Beach Towel', 'Beach'),
        item('Sunglasses', 'Beach'),
        item('Cover-Up', 'Beach'),
        item('Waterproof Phone Pouch', 'Beach'),
        item('Aloe Vera', 'Beach'),
      ];
    case 'Swimming':
      return [
        { name: 'Swimsuit', category: 'Swimming', quantity: 2, isMustPack: false },
        item('Swim Goggles', 'Swimming'),
        item('Flip Flops / Sandals', 'Swimming'),
        item('Swim Cap', 'Swimming'),
        item('Swim Towel', 'Swimming'),
        item('Waterproof Phone Pouch', 'Swimming'),
      ];
    case 'Hiking':
      return [
        item('Hiking Boots', 'Hiking'),
        { name: 'Moisture-Wicking Shirts', category: 'Hiking', quantity: outfits, isMustPack: false },
        item('Trekking Poles', 'Hiking'),
        item('Day Bag / Backpack', 'Hiking'),
        item('Water Bottle', 'Hiking'),
        item('Trail Snacks', 'Hiking'),
        item('First Aid Kit', 'Hiking'),
        item('Sunscreen', 'Hiking'),
        item('Sunglasses', 'Hiking'),
        item('Insect Repellent', 'Hiking'),
      ];
    case 'Camping':
      return [
        item('Tent', 'Camping'), item('Sleeping Bag', 'Camping'), item('Sleeping Pad', 'Camping'),
        item('Pillow', 'Camping'), item('Tarp / Ground Cloth', 'Camping'),
        item('Headlamp', 'Camping'), item('Lantern', 'Camping'), item('Extra Batteries', 'Camping'),
        item('Cooler', 'Camping'), item('Camp Stove', 'Camping'), item('Fuel', 'Camping'),
        item('Cookset', 'Camping'), item('Eating Utensils', 'Camping'),
        item('Plates / Bowls', 'Camping'), item('Mug / Cup', 'Camping'),
        item('Can Opener / Bottle Opener', 'Camping'), item('Cutting Board & Knife', 'Camping'),
        item('Biodegradable Soap', 'Camping'), item('Sponge / Scrubber', 'Camping'),
        item('Aluminum Foil', 'Camping'), item('Paper Towels', 'Camping'),
        item('Food / Meals', 'Camping'), item('Snacks', 'Camping'), item('Coffee / Tea', 'Camping'),
        item('Water Bottle', 'Camping'), item('Water Filter / Purifier', 'Camping'),
        item('Fire Starter', 'Camping'), item('Lighter / Matches', 'Camping'),
        item('Firewood / Fire Logs', 'Camping'),
        item('Camp Chair', 'Camping'), item('Camp Table', 'Camping'),
        item('First Aid Kit', 'Camping'), item('Insect Repellent', 'Camping'),
        item('Sunscreen', 'Camping'), item('Toilet Paper', 'Camping'),
        item('Hand Sanitizer', 'Camping'), item('Trash Bags', 'Camping'),
        item('Knife / Multi-tool', 'Camping'), item('Duct Tape', 'Camping'),
        item('Rope / Paracord', 'Camping'),
      ];
    case 'Backpacking':
      return [
        item('Backpacking Pack', 'Backpacking'), item('Backpacking Tent', 'Backpacking'),
        item('Sleeping Bag', 'Backpacking'), item('Sleeping Pad', 'Backpacking'),
        item('Headlamp', 'Backpacking'), item('Trekking Poles', 'Backpacking'),
        item('Rain Cover', 'Backpacking'),
        item('Map (waterproof sleeve)', 'Backpacking'), item('Compass', 'Backpacking'),
        item('Water Bottle', 'Backpacking'), item('Water Filter / Purifier', 'Backpacking'),
        item('Food / Meals', 'Backpacking'), item('Trail Snacks', 'Backpacking'),
        item('Extra Day\'s Food Supply', 'Backpacking'),
        item('Backpacking Stove', 'Backpacking'), item('Fuel', 'Backpacking'),
        item('Cookset', 'Backpacking'), item('Eating Utensils', 'Backpacking'),
        item('Mug / Cup', 'Backpacking'), item('Bear Canister / Food Sack', 'Backpacking'),
        item('Biodegradable Soap', 'Backpacking'),
        item('First Aid Kit', 'Backpacking'), item('Hand Sanitizer', 'Backpacking'),
        item('Sunscreen', 'Backpacking'), item('Sun Hat', 'Backpacking'),
        item('Sunglasses', 'Backpacking'), item('Insect Repellent', 'Backpacking'),
        item('Toilet Paper & Sealable Bag', 'Backpacking'), item('Sanitation Trowel', 'Backpacking'),
        item('Whistle', 'Backpacking'), item('Lighter / Matches', 'Backpacking'),
        item('Fire Starter', 'Backpacking'), item('Emergency Shelter', 'Backpacking'),
        item('Knife / Multi-tool', 'Backpacking'), item('Duct Tape', 'Backpacking'),
        item('Repair Kit', 'Backpacking'), item('Permits', 'Backpacking'),
      ];
    case 'Business':
      return [
        { name: 'Dress Shirts / Blouses', category: 'Business', quantity: outfits, isMustPack: false },
        item('Blazer', 'Business'), item('Dress Shoes', 'Business'),
        { name: 'Dress Socks', category: 'Business', quantity: outfits, isMustPack: false },
        item('Belt', 'Business'), item('Laptop + Charger', 'Business'),
        item('Portfolio / Notebook', 'Business'), item('Tie / Statement Jewelry', 'Business'),
      ];
    case 'Gym / Fitness':
      return [
        { name: 'Workout Clothes', category: 'Gym / Fitness', quantity: 2, isMustPack: false },
        item('Running Shoes', 'Gym / Fitness'), item('Gym Towel', 'Gym / Fitness'),
        item('Earbuds / Headphones', 'Gym / Fitness'), item('Water Bottle', 'Gym / Fitness'),
        item('Resistance Bands', 'Gym / Fitness'),
      ];
    case 'Skiing':
      return [
        item('Ski Goggles', 'Skiing'),
        { name: 'Base Layers', category: 'Skiing', quantity: 2, isMustPack: false },
        { name: 'Ski Socks', category: 'Skiing', quantity: 2, isMustPack: false },
        item('Warm Gloves', 'Skiing'), item('Hand Warmers', 'Skiing'),
        item('Neck Gaiter', 'Skiing'), item('Lip Balm', 'Skiing'),
        item('Helmet', 'Skiing'), item('Thermal Underwear', 'Skiing'),
        item('Water Bottle / Hydration Bladder', 'Skiing'),
      ];
    case 'Backcountry Skiing':
      return [
        item('Avalanche Beacon', 'Backcountry Skiing'), item('Shovel', 'Backcountry Skiing'),
        item('Probe', 'Backcountry Skiing'), item('Backpack / Airbag', 'Backcountry Skiing'),
        item('Climbing Skins', 'Backcountry Skiing'),
        item('Splitboard or Skis with Touring Bindings', 'Backcountry Skiing'),
        item('Touring Boots', 'Backcountry Skiing'), item('Collapsible Poles', 'Backcountry Skiing'),
        item('Ski Straps', 'Backcountry Skiing'),
        item('Down or Synthetic Insulation Jacket', 'Backcountry Skiing'),
        item('Waterproof Shell', 'Backcountry Skiing'),
        item('Thin Touring Gloves', 'Backcountry Skiing'),
        item('Warmer Riding Gloves', 'Backcountry Skiing'),
        item('Extra Mid Layer', 'Backcountry Skiing'), item('Extra Base Layer', 'Backcountry Skiing'),
        item('Warm Hat', 'Backcountry Skiing'), item('Sunglasses', 'Backcountry Skiing'),
        item('Ski Goggles', 'Backcountry Skiing'),
        item('Navigation Equipment (Maps, GPS)', 'Backcountry Skiing'),
        item('First Aid Kit', 'Backcountry Skiing'), item('Repair Kit', 'Backcountry Skiing'),
        item('Headlamp', 'Backcountry Skiing'),
        item('Cell Phone / Radio / Satellite Phone', 'Backcountry Skiing'),
        item('Water Bottle / Hydration Bladder', 'Backcountry Skiing'),
      ];
    case 'Wedding':
      return [
        item('Formal Outfit', 'Wedding'), item('Dress Shoes', 'Wedding'),
        item('Accessories (Tie / Jewelry)', 'Wedding'), item('Gift', 'Wedding'),
        item('Gift Bag', 'Wedding'), item('Card', 'Wedding'),
        item('Garment Bag', 'Wedding'), item('Steamer', 'Wedding'),
      ];
    case 'Formal Dinner':
      return [
        item('Formal Outfit', 'Formal Dinner'), item('Dress Shoes', 'Formal Dinner'),
        item('Accessories (Tie / Jewelry)', 'Formal Dinner'),
        item('Evening Bag / Clutch', 'Formal Dinner'), item('Cologne / Perfume', 'Formal Dinner'),
      ];
    case 'Concert':
      return [
        item('Comfortable Walking Shoes', 'Concert'), item('Earplugs', 'Concert'),
        item('Portable Charger / Power Bank', 'Concert'), item('Light Jacket', 'Concert'),
        item('Fanny Pack', 'Concert'),
      ];
    case 'Festival':
      return [
        item('Comfortable Walking Shoes', 'Festival'), item('Sunscreen', 'Festival'),
        item('Sun Hat', 'Festival'), item('Rain Jacket', 'Festival'),
        item('Fanny Pack', 'Festival'), item('Portable Charger / Power Bank', 'Festival'),
        item('Hand Sanitizer', 'Festival'), item('Water Bottle', 'Festival'),
        item('Earplugs', 'Festival'), item('Bandana', 'Festival'),
      ];
    case 'Photography':
      return [
        item('Camera / Mirrorless Body', 'Photography'),
        item('Lenses', 'Photography'),
        item('Tripod', 'Photography'),
        item('Camera Batteries', 'Photography'),
        item('Memory Cards', 'Photography'),
        item('Camera Charger & Cables', 'Photography'),
        item('Lens Cleaning Kit', 'Photography'),
        item('Camera Bag / Insert', 'Photography'),
        item('Action Camera (GoPro / Insta360)', 'Photography'),
      ];
    default:
      return [];
  }
}

function getWeatherItems(summary: WeatherSummary): PackingItemDraft[] {
  const items: PackingItemDraft[] = [];
  const avgLowF = summary.avgLow * 9 / 5 + 32;
  const avgHighF = summary.avgHigh * 9 / 5 + 32;

  const rainCodes = new Set([61, 63, 65, 80, 81, 82]);
  const drizzleCodes = new Set([51, 53, 55]);
  const snowCodes = new Set([71, 73, 75, 77, 85, 86]);
  const thunderCodes = new Set([95, 96, 99]);

  const hasRain = summary.forecasts.some(f => rainCodes.has(f.weatherCode)) || summary.maxPrecipProb >= 50;
  const hasDrizzle = summary.forecasts.some(f => drizzleCodes.has(f.weatherCode));
  const hasSnow = summary.forecasts.some(f => snowCodes.has(f.weatherCode));
  const hasThunderstorm = summary.forecasts.some(f => thunderCodes.has(f.weatherCode));

  if (hasRain || hasThunderstorm) {
    items.push(item('Rain Jacket', 'Clothing'), item('Umbrella', 'Essentials'), item('Waterproof Bag', 'Essentials'));
  } else if (hasDrizzle || summary.maxPrecipProb >= 30) {
    items.push(item('Light Rain Jacket', 'Clothing'), item('Umbrella', 'Essentials'));
  }

  if (hasSnow) {
    items.push(
      item('Winter Coat', 'Clothing'), item('Warm Gloves', 'Clothing'),
      item('Beanie / Winter Hat', 'Clothing'), item('Scarf', 'Clothing'),
      item('Thermal Underwear', 'Clothing'), item('Waterproof Boots', 'Clothing'),
      { name: 'Thick Socks', category: 'Clothing', quantity: 2, isMustPack: false },
    );
  }

  if (!hasSnow) {
    if (avgLowF < 40) {
      items.push(
        item('Heavy Jacket', 'Clothing'), item('Warm Gloves', 'Clothing'),
        item('Beanie / Winter Hat', 'Clothing'), item('Scarf', 'Clothing'),
        item('Thermal Underwear', 'Clothing'), item('Warm Boots', 'Clothing'),
      );
    } else if (avgLowF < 55) {
      items.push(item('Jacket', 'Clothing'), item('Sweater / Hoodie', 'Clothing'), item('Long Pants', 'Clothing'));
    } else if (avgHighF > 85) {
      items.push(
        item('Sunscreen', 'Essentials'), item('Sunglasses', 'Essentials'),
        item('Sun Hat', 'Clothing'), item('Light / Breathable Clothing', 'Clothing'),
        item('Water Bottle', 'Essentials'),
      );
    } else {
      items.push(item('Light Jacket', 'Clothing'));
    }
  }

  return items;
}

function deduplicate(items: PackingItemDraft[]): PackingItemDraft[] {
  const seen = new Map<string, PackingItemDraft>();
  for (const it of items) {
    const key = it.name.toLowerCase();
    const existing = seen.get(key);
    if (existing) {
      if (it.quantity > existing.quantity) seen.set(key, it);
      if (it.isMustPack && !existing.isMustPack) {
        const merged = seen.get(key)!;
        seen.set(key, { ...merged, isMustPack: true });
      }
    } else {
      seen.set(key, it);
    }
  }

  const result: PackingItemDraft[] = [];
  const added = new Set<string>();
  for (const it of items) {
    const key = it.name.toLowerCase();
    if (!added.has(key)) {
      result.push(seen.get(key)!);
      added.add(key);
    }
  }
  return result;
}

function getLongestStretch(trip: {
  startDate: string; endDate: string; hasLaundry: boolean; laundryDates: string[];
}): number {
  const start = new Date(trip.startDate).getTime();
  const end = new Date(trip.endDate).getTime();
  const tripDays = Math.max(Math.round((end - start) / 86400000), 1);
  if (!trip.hasLaundry || trip.laundryDates.length === 0) return tripDays;

  const sorted = trip.laundryDates.map(d => new Date(d).getTime()).sort((a, b) => a - b);
  const boundaries = [start, ...sorted, end];
  let maxGap = 0;
  for (let i = 1; i < boundaries.length; i++) {
    maxGap = Math.max(maxGap, Math.round((boundaries[i] - boundaries[i - 1]) / 86400000));
  }
  return Math.max(maxGap, 1);
}
