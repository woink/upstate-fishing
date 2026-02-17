/**
 * Cached USGS Service
 *
 * Wraps USGSService with Deno KV caching.
 * TTL: 15 minutes (USGS data updates every 15 minutes)
 */

import type { StationData } from '../models/types.ts';
import { type CacheLike, cacheService, makeUSGSKey, TTL } from './cache.ts';
import { USGS_PARAMS, USGSService } from './usgs.ts';
import { logger } from '../utils/logger.ts';

export interface CachedUSGSResult {
  data: StationData[];
  cached: boolean;
  cachedAt: number | null;
}

export class CachedUSGSService {
  private readonly usgs: USGSService;
  private readonly cache: CacheLike;

  constructor(usgs?: USGSService, cache?: CacheLike) {
    this.usgs = usgs ?? new USGSService();
    this.cache = cache ?? cacheService;
  }

  /**
   * Get station data with caching
   */
  async getInstantaneousValues(
    stationIds: string[],
    params: string[] = [USGS_PARAMS.WATER_TEMP, USGS_PARAMS.DISCHARGE, USGS_PARAMS.GAGE_HEIGHT],
  ): Promise<CachedUSGSResult> {
    if (stationIds.length === 0) {
      return { data: [], cached: false, cachedAt: null };
    }

    const key = makeUSGSKey(stationIds, params);

    // Try cache first — treat failure as cache miss
    let cached: { data: StationData[]; hit: boolean; cachedAt: number | null } | null = null;
    try {
      cached = await this.cache.get<StationData[]>(key);
    } catch (err) {
      logger.warn('Cache read failed, falling back to API', {
        key: key.join('/'),
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (cached) {
      return {
        data: cached.data,
        cached: true,
        cachedAt: cached.cachedAt,
      };
    }

    // Fetch from API
    const data = await this.usgs.getInstantaneousValues(stationIds, params);

    // Cache the result — swallow failure, data already fetched
    try {
      await this.cache.set(key, data, TTL.USGS_MS);
    } catch (err) {
      logger.warn('Cache write failed', {
        key: key.join('/'),
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return {
      data,
      cached: false,
      cachedAt: null,
    };
  }

  /**
   * Invalidate cache for specific stations
   */
  async invalidate(
    stationIds: string[],
    params: string[] = [USGS_PARAMS.WATER_TEMP, USGS_PARAMS.DISCHARGE, USGS_PARAMS.GAGE_HEIGHT],
  ): Promise<void> {
    const key = makeUSGSKey(stationIds, params);
    await this.cache.delete(key);
  }
}

// Default singleton instance
export const cachedUSGSService = new CachedUSGSService();
