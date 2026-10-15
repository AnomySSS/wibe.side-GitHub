/**
 * Anti-Spam Rate Limiter for Event Creation:
 * Rules:
 * 1. Maximum 1 event per hour (60-minute cooldown after creating an event).
 * 2. Maximum 2 events per day (24-hour rolling window).
 */

const STORAGE_KEY = 'wibe_user_creation_history';
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface RateLimitStatus {
  canCreate: boolean;
  reason?: string;
  hourlyCooldownRemainingMs: number;
  hourlyCooldownRemainingMinutes: number;
  dailyCount: number;
  maxDaily: number;
  dailySlotsRemaining: number;
  nextAvailableTimeMs?: number;
}

export function getCreationHistory(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((t) => typeof t === 'number' && !isNaN(t));
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

export function saveCreationHistory(timestamps: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
  } catch {
    // ignore storage errors
  }
}

export function recordNewCreation(): number[] {
  const current = getCreationHistory();
  const now = Date.now();
  const updated = [...current, now];
  saveCreationHistory(updated);
  return updated;
}

export function resetCreationHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function checkCreationRateLimit(history: number[] = getCreationHistory()): RateLimitStatus {
  const now = Date.now();

  // Clean up history older than 24 hours
  const inLast24Hours = history.filter((ts) => now - ts < ONE_DAY_MS);
  const dailyCount = inLast24Hours.length;
  const maxDaily = 2;
  const dailySlotsRemaining = Math.max(0, maxDaily - dailyCount);

  // Check hourly cooldown: most recent creation
  const mostRecent = history.length > 0 ? Math.max(...history) : 0;
  const timeSinceLastCreation = now - mostRecent;
  const inHourlyCooldown = mostRecent > 0 && timeSinceLastCreation < ONE_HOUR_MS;
  const hourlyCooldownRemainingMs = inHourlyCooldown ? ONE_HOUR_MS - timeSinceLastCreation : 0;
  const hourlyCooldownRemainingMinutes = Math.ceil(hourlyCooldownRemainingMs / 60000);

  if (dailyCount >= maxDaily) {
    // Earliest of the 2 events will expire 24h after its creation
    const sorted = [...inLast24Hours].sort((a, b) => a - b);
    const nextSlotOpensMs = sorted[0] + ONE_DAY_MS;
    const hoursLeft = Math.ceil((nextSlotOpensMs - now) / 3600000);

    return {
      canCreate: false,
      reason: `Dosažen denní limit: Můžeš vytvořit maximálně 2 události za den. Další slot se uvolní přibližně za ${hoursLeft} hod.`,
      hourlyCooldownRemainingMs,
      hourlyCooldownRemainingMinutes,
      dailyCount,
      maxDaily,
      dailySlotsRemaining: 0,
      nextAvailableTimeMs: nextSlotOpensMs,
    };
  }

  if (inHourlyCooldown) {
    const nextSlotOpensMs = mostRecent + ONE_HOUR_MS;
    return {
      canCreate: false,
      reason: `Ochrana před spamem: Můžeš vytvořit max. 1 událost za hodinu. Další událost můžeš vytvořit za ${hourlyCooldownRemainingMinutes} min.`,
      hourlyCooldownRemainingMs,
      hourlyCooldownRemainingMinutes,
      dailyCount,
      maxDaily,
      dailySlotsRemaining,
      nextAvailableTimeMs: nextSlotOpensMs,
    };
  }

  return {
    canCreate: true,
    hourlyCooldownRemainingMs: 0,
    hourlyCooldownRemainingMinutes: 0,
    dailyCount,
    maxDaily,
    dailySlotsRemaining,
  };
}
