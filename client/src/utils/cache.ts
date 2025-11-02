/**
 * LocalStorage Cache Utility with TTL (Time To Live)
 * Provides persistent caching with automatic expiration
 */

// Cache version - increment this when database schema/data changes
// This will invalidate all old cache automatically
const CACHE_VERSION = 2; // Incremented after ADMK->AIADMK fix

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: number; // Cache version
}

/**
 * Get item from cache
 * Returns null if not found, expired, or version mismatch
 */
export function getCached<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const cached: CacheItem<T> = JSON.parse(item);
    const now = Date.now();

    // Check version - auto-invalidate old cache
    if (!cached.version || cached.version !== CACHE_VERSION) {
      localStorage.removeItem(key);
      console.log(`🔄 Cache invalidated (old version): ${key}`);
      return null;
    }

    // Check if expired
    if (now - cached.timestamp > cached.ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Set item in cache with TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in milliseconds (default: 1 hour)
 */
export function setCached<T>(key: string, data: T, ttl: number = 3600000): void {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Cache write error:', error);
    // Silently fail if localStorage is full
  }
}

/**
 * Remove item from cache
 */
export function removeCached(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Cache remove error:', error);
  }
}

/**
 * Clear all cache items with a specific prefix
 */
export function clearCacheByPrefix(prefix: string): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Get cache size in bytes
 */
export function getCacheSize(): number {
  let size = 0;
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
  } catch (error) {
    console.error('Cache size calculation error:', error);
  }
  return size;
}

// Cache key constants
export const CACHE_KEYS = {
  CONSTITUENCIES: 'votelytics:constituencies',
  WINNERS_2021: 'votelytics:winners:2021',
  WINNERS_2016: 'votelytics:winners:2016',
  CONSTITUENCY_PREFIX: 'votelytics:constituency:',
  HISTORY_PREFIX: 'votelytics:history:',
  PARTY_PREFIX: 'votelytics:party:',
  PARTY_RESULTS_PREFIX: 'votelytics:party:results:',
};

// TTL constants (in milliseconds)
export const CACHE_TTL = {
  ONE_HOUR: 3600000,      // 1 hour
  SIX_HOURS: 21600000,    // 6 hours
  ONE_DAY: 86400000,      // 24 hours
  ONE_WEEK: 604800000,    // 7 days
};

/**
 * Clear all Votelytics cache
 * Useful when database is updated or party names are standardized
 */
export function clearAllVotelyticsCache(): void {
  clearCacheByPrefix('votelytics:');
  console.log('✅ All Votelytics cache cleared');
}

// Make it globally available for console access
if (typeof window !== 'undefined') {
  (window as any).clearVotelyticsCache = clearAllVotelyticsCache;
}
