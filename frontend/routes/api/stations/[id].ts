import { Handlers } from '$fresh/server.ts';
import { cachedUSGSService } from '@shared/services/cached-usgs.ts';
import { makeCacheHeaders, TTL } from '@shared/services/cache.ts';
import { apiError, CACHE_DYNAMIC } from '../../../utils/api-response.ts';

export const handler: Handlers = {
  async GET(_req, ctx) {
    const id = ctx.params.id;

    try {
      const result = await cachedUSGSService.getInstantaneousValues([id]);

      if (result.data.length === 0) {
        return apiError('Station not found or no data available', 'NOT_FOUND', 404);
      }

      const cacheHeaders = makeCacheHeaders(result.cached, TTL.USGS_SECONDS, result.cachedAt);

      return Response.json(
        {
          success: true,
          data: result.data[0],
          cache: result.cached ? 'HIT' : 'MISS',
          timestamp: new Date().toISOString(),
        },
        { headers: { ...cacheHeaders, 'Cache-Control': CACHE_DYNAMIC } },
      );
    } catch (err) {
      return apiError(
        'Failed to fetch station data',
        'FETCH_ERROR',
        500,
        err instanceof Error ? err.message : String(err),
      );
    }
  },
};
