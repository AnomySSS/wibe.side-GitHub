export type EventCategory =
  | 'sport'
  | 'party'
  | 'kava'
  | 'deskovky'
  | 'prochazky'
  | 'kultura';

export type RegionCity =
  | 'Hradec Králové'
  | 'Trutnov'
  | 'Náchod'
  | 'Jičín'
  | 'Rychnov nad Kněžnou';

export const REGION_CITIES: RegionCity[] = [
  'Hradec Králové',
  'Trutnov',
  'Náchod',
  'Jičín',
  'Rychnov nad Kněžnou',
];

export interface CategoryMeta {
  id: EventCategory;
  name: string;
  shortName: string;
  description: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
}

export const CATEGORY_MAP: Record<EventCategory, CategoryMeta> = {
  sport: {
    id: 'sport',
    name: 'Sport',
    shortName: 'Sport',
    description: 'Běh, cyklistika, workout a venkovní tréninky',
    colorHex: '#0ea5e9', // Sky Cyan
    bgClass: 'bg-sky-500',
    textClass: 'text-sky-400',
  },
  party: {
    id: 'party',
    name: 'Párty',
    shortName: 'Párty',
    description: 'Večerní setkání, střešní hudební akce a přátelé',
    colorHex: '#d946ef', // Neon Fuchsia / Magenta
    bgClass: 'bg-fuchsia-500',
    textClass: 'text-fuchsia-400',
  },
  kava: {
    id: 'kava',
    name: 'Káva a pokec',
    shortName: 'Káva a pokec',
    description: 'Výběrová káva, diskuse a neformální setkání',
    colorHex: '#f59e0b', // Warm Amber Gold
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-400',
  },
  deskovky: {
    id: 'deskovky',
    name: 'Deskovky',
    shortName: 'Deskovky',
    description: 'Moderní deskové hry, strategické partie a kvízy',
    colorHex: '#6366f1', // Vibrant Indigo
    bgClass: 'bg-indigo-500',
    textClass: 'text-indigo-400',
  },
  prochazky: {
    id: 'prochazky',
    name: 'Procházky',
    shortName: 'Procházky',
    description: 'Výpravy do přírody, hřebenovky a vyhlídky',
    colorHex: '#10b981', // Fresh Emerald Nature
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-400',
  },
  kultura: {
    id: 'kultura',
    name: 'Kultura a knihy',
    shortName: 'Kultura a knihy',
    description: 'Čtenářské kluby, výstavy a lokální kultura',
    colorHex: '#f43f5e', // Vibrant Rose / Coral
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-400',
  },
};

/**
 * Green-Yellow-Red Density Spectrum:
 * User rule:
 * - 0 events: completely transparent / colorless (not drawn on canvas).
 * - FEWER events = REDDER circle (1 event = Red).
 * - MORE events = GREENER circle (6+ events = Green).
 * - Shades in between: Orange (2 events) -> Yellow (3-4 events) -> Lime (5 events) -> Emerald Green (6+ events).
 */
export function getDensityColor(count: number): {
  rgb: [number, number, number];
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  label: string;
} {
  if (count <= 0) {
    return {
      rgb: [0, 0, 0],
      hex: 'transparent',
      bgClass: 'bg-transparent',
      borderClass: 'border-transparent',
      textClass: 'text-slate-400',
      label: 'Bez akcí (bezbarvé)',
    };
  }
  if (count === 1) {
    // 1 event: Subtle warm amber/gold (no aggressive red)
    return {
      rgb: [245, 158, 11],
      hex: '#F59E0B',
      bgClass: 'bg-amber-600',
      borderClass: 'border-amber-500',
      textClass: 'text-amber-400',
      label: '1 akce (jantarová - klidná aktivita)',
    };
  }
  if (count === 2) {
    // 2 events: Golden warm glow
    return {
      rgb: [234, 179, 8],
      hex: '#EAB308',
      bgClass: 'bg-yellow-600',
      borderClass: 'border-yellow-500',
      textClass: 'text-yellow-400',
      label: '2 akce (zlatá aktivita)',
    };
  }
  if (count <= 4) {
    // 3-4 events: Amber Yellow
    return {
      rgb: [245, 158, 11],
      hex: '#F59E0B',
      bgClass: 'bg-amber-500',
      borderClass: 'border-amber-400',
      textClass: 'text-amber-400',
      label: '3–4 akce (žlutá)',
    };
  }
  if (count === 5) {
    // 5 events: Lime / Yellow-Green shade
    return {
      rgb: [132, 204, 22],
      hex: '#84CC16',
      bgClass: 'bg-lime-600',
      borderClass: 'border-lime-500',
      textClass: 'text-lime-400',
      label: '5 akcí (světle zelená)',
    };
  }
  // 6+ events: Vibrant Emerald Green (nejvíce akcí = nejzelenější)
  return {
    rgb: [16, 185, 129],
    hex: '#10B981',
    bgClass: 'bg-emerald-600',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-400',
    label: `Aktivní hotspot (${count} akcí - nejzelenější)`,
  };
}

export interface CommentItem {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  rating: number; // 0.0 to 10.0
  text: string;
  timestamp: string;
  attachedPhotoUrl?: string;
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  caption: string;
  videoDurationLabel?: string;
}

/**
 * Wibe-Side Teen Minimalist Dark Palette (based on user image):
 * - #c9e8ff: Soft ice blue
 * - #f6fbff: Crisp ice white
 * - #a7c7e7: Muted steel blue
 * - #ffd9e8: Pastel sakura pink
 * - #8fb7ff: Periwinkle blue
 */
export const WIBE_PALETTE = {
  iceSky: '#c9e8ff',
  iceWhite: '#f6fbff',
  steelBlue: '#a7c7e7',
  sakuraPink: '#ffd9e8',
  periwinkle: '#8fb7ff',
  darkBg: '#090d16',
  darkSurface: '#0f172a',
  darkCard: '#131e33',
  darkBorder: '#1e2d4a',
};

export interface MeetupEvent {
  id: string;
  title: string;
  category: EventCategory;
  city: RegionCity;
  lat: number;
  lng: number;
  address: string;
  startTime: string;
  startsAtTimestamp: number; // epoch ms
  durationHours: number; // max 48h
  durationLabel: string;
  expiresAtTimestamp: number; // epoch ms: event disappears after this time
  description: string;
  capacity: number;
  attendeesCount: number;
  attendeeIds: string[];
  isPublic: boolean;
  isActive: boolean; // true = probíhá právě teď (aktivní); false = nadcházející (ještě neaktivní)
  likesCount: number;
  isLikedByMe: boolean;
  smsAlertSubscribed: boolean;
  hostId: string;
  hostNickname: string;
  hostRealName: string; // Skutečné jméno — always visible on Event Founder card
  hostAvatar: string;
  hostRating: number;
  hostOrganizedCount: number;
  hostVerified: boolean;
  media: MediaItem[];
  comments: CommentItem[];
  checkedInByMe: boolean;
  highRatingBonusAwarded?: boolean;
  activityRadiusMeters: number;
}

export interface BadgeItem {
  id: string;
  title: string;
  subtitle: string;
  tier: 'gold' | 'silver' | 'bronze' | 'emerald' | 'blue';
}

export interface UserProfile {
  id: string;
  realName: string;
  nickname: string;
  email: string;
  authProvider: 'google' | 'email' | 'phone';
  phoneNumber?: string;
  isRegistered?: boolean;
  avatarUrl: string;
  city: RegionCity;
  xpPoints: number;
  weeklyXpPoints: number;
  isVerifiedHost: boolean;
  tags: string[];
  badges: BadgeItem[];
  friendIds: string[];
  organizedCount: number;
  visitedEventIds: string[];
  bio: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  createdAt?: number;
  liked?: boolean;
  likes?: string[];
  reactions?: MessageReaction[];
  mediaUrl?: string;
  isVoiceNote?: boolean;
}

export interface EventChatMessage {
  id: string;
  eventId: string;
  eventTitle: string;
  senderId: string;
  senderNickname: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  liked?: boolean;
  likes?: string[];
  reactions?: MessageReaction[];
  mediaUrl?: string;
  isVoiceNote?: boolean;
}

export interface StoryOrNoteItem {
  id: string;
  userId: string;
  userName: string;
  userNickname: string;
  userAvatar: string;
  noteText?: string;
  hasStory?: boolean;
  isCurrentUser?: boolean;
  isOnline?: boolean;
}

export const AVAILABLE_INTEREST_TAGS: string[] = [
  '18+',
  'Cestovatel',
  'Knihomol',
  'Pařmen',
  'Sportovec',
  'Kavárenský typ',
  'Deskovkář',
  'Horolezec',
  'Fotograf',
  'Hudebník',
];

export function calculateEventRating(comments: CommentItem[]): number {
  if (!comments || comments.length === 0) return 0;
  const sum = comments.reduce((acc, item) => acc + item.rating, 0);
  return Math.round((sum / comments.length) * 10) / 10;
}

export function getRatingBadgeColor(score: number): {
  bgClass: string;
  hex: string;
  textClass: string;
  label: string;
} {
  if (score <= 0) {
    return {
      bgClass: 'bg-slate-800 text-slate-300',
      hex: '#64748B',
      textClass: 'text-slate-400',
      label: 'Bez hodnocení',
    };
  }
  if (score >= 8.0) {
    return {
      bgClass: 'bg-emerald-600 text-white',
      hex: '#16A34A',
      textClass: 'text-emerald-400',
      label: 'Vysoké hodnocení',
    };
  }
  if (score >= 5.0) {
    return {
      bgClass: 'bg-amber-500 text-slate-950',
      hex: '#D97706',
      textClass: 'text-amber-400',
      label: 'Průměrné hodnocení',
    };
  }
  return {
    bgClass: 'bg-red-600 text-white',
    hex: '#DC2626',
    textClass: 'text-red-400',
    label: 'Nízké hodnocení',
  };
}

/**
 * Calculates Haversine distance in meters between two coordinates
 */
export function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
