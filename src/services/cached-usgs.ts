/**
 * Cached USGS Service
 *
 * Wraps USGSService with Deno KV caching.
 * TTL: 15 minutes (USGS data updates every 15 minutes)
 */

import type { StationData } from '../models/types.ts';
import { cacheService, makeUSGSKey, TTL } from './cache.ts';
import { USGSService, USGS_PARAMS } from './usgs.ts';

export interface CachedUSGSResult {
  data: StationData[];
  cached: boolean;
  cachedAt: number | null;
}

export class CachedUSGSService {
  private readonly usgs: USGSService;

  constructor(usgs?: USGSService) {
    this.usgs = usgs ?? new USGSService();
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

    // Try cache first
    const cached = await cacheService.get<StationData[]>(key);
    if (cached) {
      return {
        data: cached.data,
        cached: true,
        cachedAt: cached.cachedAt,
      };
    }

    // Fetch from API
    const data = await this.usgs.getInstantaneousValues(stationIds, params);

    // Cache the result
    await cacheService.set(key, data, TTL.USGS_MS);

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
    await cacheService.delete(key);
  }
}

// Default singleton instance
export const cachedUSGSService = new CachedUSGSService();
