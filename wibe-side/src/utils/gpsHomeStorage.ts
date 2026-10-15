/**
 * Persistent GPS Home Storage Utility
 * User requirement:
 * "nemusíš zadávat domovský kraj, místo toho zapneš GPS,
 * aplikace si zapamatuje polohu a vezme ji jako domov,
 * dokud ji znovu nezapneš a neaktualizuješ."
 */

export interface SavedGpsHome {
  lat: number;
  lng: number;
  label: string;
  savedAt: number; // timestamp
}

const STORAGE_KEY = 'wibe_saved_gps_home';

// Default fallback coordinate (Hradec Králové center) if user has never turned on GPS
export const DEFAULT_FALLBACK_GPS: SavedGpsHome = {
  lat: 50.2096,
  lng: 15.8338,
  label: 'Výchozí poloha (Hradec Králové)',
  savedAt: 0,
};

/**
 * Retrieves the user's persisted home GPS coordinates from localStorage.
 */
export function getSavedGpsHome(): SavedGpsHome {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FALLBACK_GPS;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.lat === 'number' &&
      typeof parsed?.lng === 'number' &&
      !isNaN(parsed.lat) &&
      !isNaN(parsed.lng)
    ) {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        label: parsed.label || 'Uložený domov (GPS)',
        savedAt: parsed.savedAt || Date.now(),
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_FALLBACK_GPS;
}

/**
 * Persists the given coordinates as user's permanent "Home" until updated again.
 */
export function saveGpsHome(lat: number, lng: number, label?: string): SavedGpsHome {
  const newHome: SavedGpsHome = {
    lat,
    lng,
    label: label || `Domov (GPS: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHome));
  } catch {
    // ignore quota error
  }
  return newHome;
}

/**
 * Checks whether the user has ever saved their GPS home explicitly.
 */
export function isGpsHomeSaved(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
