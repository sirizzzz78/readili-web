export interface ActivityDef {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  subtitle: string;
  isEvent: boolean;
}

export const ACTIVITIES: ActivityDef[] = [
  { id: 'Sightseeing', label: 'Sightseeing', icon: 'binoculars', subtitle: 'Walking shoes, day bag, camera', isEvent: false },
  { id: 'Beach', label: 'Beach', icon: 'umbrella', subtitle: 'Swimsuit, sunscreen, towel', isEvent: false },
  { id: 'Swimming', label: 'Swimming', icon: 'waves', subtitle: 'Swimsuit, goggles, flip flops', isEvent: false },
  { id: 'Hiking', label: 'Hiking', icon: 'mountain', subtitle: 'Boots, daypack, first aid', isEvent: false },
  { id: 'Camping', label: 'Camping', icon: 'tent', subtitle: 'Tent, sleeping bag, stove', isEvent: false },
  { id: 'Backpacking', label: 'Backpacking', icon: 'backpack', subtitle: 'Full gear, kitchen, navigation', isEvent: false },
  { id: 'Business', label: 'Business', icon: 'briefcase', subtitle: 'Dress shirts, laptop, blazer', isEvent: false },
  { id: 'Gym / Fitness', label: 'Gym / Fitness', icon: 'dumbbell', subtitle: 'Workout clothes, running shoes', isEvent: false },
  { id: 'Skiing', label: 'Skiing', icon: 'snowflake', subtitle: 'Goggles, base layers, warmers', isEvent: false },
  { id: 'Backcountry Skiing', label: 'Backcountry Skiing', icon: 'mountain-snow', subtitle: 'Beacon, skins, avalanche gear', isEvent: false },
  { id: 'Photography', label: 'Photography', icon: 'camera', subtitle: 'Camera, tripod, lenses, cables', isEvent: false },
  { id: 'Wedding', label: 'Wedding', icon: 'heart', subtitle: 'Formal attire, gift, accessories', isEvent: true },
  { id: 'Formal Dinner', label: 'Formal Dinner', icon: 'utensils', subtitle: 'Formal outfit, dress shoes', isEvent: true },
  { id: 'Concert', label: 'Concert', icon: 'mic', subtitle: 'Comfy shoes, earplugs, charger', isEvent: true },
  { id: 'Festival', label: 'Festival', icon: 'party-popper', subtitle: 'Sunscreen, poncho, fanny pack', isEvent: true },
];

export const ACTIVITY_LIST = ACTIVITIES.filter(a => !a.isEvent);
export const EVENT_LIST = ACTIVITIES.filter(a => a.isEvent);

export interface TransportDef {
  id: string;
  label: string;
  icon: string;
}

export const TRANSPORTS: TransportDef[] = [
  { id: 'Car', label: 'Car', icon: 'car' },
  { id: 'Train', label: 'Train', icon: 'train-front' },
  { id: 'Flight', label: 'Flight', icon: 'plane' },
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Clothing': 'shirt',
  'Toiletries': 'shower-head',
  'Essentials': 'star',
  'Health': 'heart-pulse',
  'Sightseeing': 'binoculars',
  'Beach': 'umbrella',
  'Swimming': 'waves',
  'Hiking': 'mountain',
  'Camping': 'tent',
  'Backpacking': 'backpack',
  'Business': 'briefcase',
  'Gym / Fitness': 'dumbbell',
  'Skiing': 'snowflake',
  'Backcountry Skiing': 'mountain-snow',
  'Photography': 'camera',
  'Wedding': 'heart',
  'Formal Dinner': 'utensils',
  'Concert': 'mic',
  'Festival': 'party-popper',
};

export const CATEGORY_OPTIONS = [
  'Essentials', 'Clothing', 'Toiletries', 'Health',
  'Sightseeing', 'Beach', 'Swimming', 'Hiking', 'Camping', 'Backpacking',
  'Business', 'Gym / Fitness', 'Skiing', 'Photography',
  'Wedding', 'Formal Dinner', 'Concert', 'Festival',
];

export const ALL_ACTIVITIES: ActivityDef[] = [...ACTIVITY_LIST, ...EVENT_LIST];
