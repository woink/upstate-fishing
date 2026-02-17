/// <reference lib="deno.unstable" />

/**
 * Caching layer using Deno KV
 *
 * Provides caching for USGS and Weather API responses to reduce latency
 * and avoid rate limits.
 */

// ============================================================================
// TTL Constants
// ============================================================================

export const TTL = {
  /** USGS data updates every 15 minutes */
  USGS_MS: 15 * 60 * 1000,
  USGS_SECONDS: 15 * 60,

  /** Weather forecasts update hourly */
  WEATHER_MS: 60 * 60 * 1000,
  WEATHER_SECONDS: 60 * 60,

  /** Static data (streams, hatches) - 24 hours */
  STATIC_MS: 24 * 60 * 60 * 1000,
  STATIC_SECONDS: 24 * 60 * 60,
} as const;

// ============================================================================
// Cache Entry Types
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

export interface CacheResult<T> {
  data: T;
  hit: boolean;
  cachedAt: number | null;
}

// ============================================================================
// Key Generation
// ============================================================================

export function makeUSGSKey(stationIds: string[], params: string[]): string[] {
  const sortedStations = [...stationIds].sort().join(',');
  const sortedParams = [...params].sort().join(',');
  return ['cache', 'usgs', `${sortedStations}:${sortedParams}`];
}

export function makeWeatherKey(latitude: number, longitude: number): string[] {
  return ['cache', 'weather', `${latitude.toFixed(4)},${longitude.toFixed(4)}`];
}

// ============================================================================
// Cache Service
// ============================================================================

export class CacheService {
  private kv: Deno.Kv | null = null;
  private stats = { hits: 0, misses: 0 };
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the Deno KV store
   */
  async init(): Promise<void> {
    if (this.kv) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      this.kv = await Deno.openKv();
    })();

    try {
      await this.initPromise;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string[]): Promise<CacheResult<T> | null> {
    await this.init();

    const result = await this.kv!.get<CacheEntry<T>>(key);

    if (!result.value) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > result.value.expiresAt) {
      this.stats.misses++;
      // Delete expired entry
      await this.kv!.delete(key);
      return null;
    }

    this.stats.hits++;
    return {
      data: result.value.data,
      hit: true,
      cachedAt: result.value.cachedAt,
    };
  }

  /**
   * Set a value in cache with TTL
   */
  async set<T>(key: string[], data: T, ttlMs: number): Promise<void> {
    await this.init();

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
    };

    // Use Deno KV's built-in expireIn for automatic cleanup
    await this.kv!.set(key, entry, { expireIn: ttlMs });
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string[]): Promise<void> {
    await this.init();
    await this.kv!.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.init();

    const entries = this.kv!.list({ prefix: ['cache'] });
    for await (const entry of entries) {
      await this.kv!.delete(entry.key);
    }

    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Close the KV store
   */
  close(): void {
    if (this.kv) {
      this.kv.close();
      this.kv = null;
      this.initPromise = null;
    }
  }
}

// Default singleton instance
export const cacheService = new CacheService();

// ============================================================================
// Cache Headers Helper
// ============================================================================

export type CacheHeaders = Record<string, string>;

export function makeCacheHeaders(
  hit: boolean,
  ttlSeconds: number,
  cachedAt?: number | null,
): CacheHeaders {
  const headers: CacheHeaders = {
    'Cache-Control': `public, max-age=${ttlSeconds}`,
    'X-Cache': hit ? 'HIT' : 'MISS',
  };

  if (cachedAt) {
    headers['X-Cached-At'] = new Date(cachedAt).toISOString();
  }

  return headers;
}
