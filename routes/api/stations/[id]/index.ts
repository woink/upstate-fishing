import { cachedUSGSService } from '@shared/services/cached-usgs.ts';
import { makeCacheHeaders, TTL } from '@shared/services/cache.ts';
import { logger } from '@shared/utils/logger.ts';
import { apiError, CACHE_DYNAMIC } from '@shared/http/api-response.ts';
import { isValidRouteId } from '@shared/http/validation.ts';

export const handler = {
  async GET(ctx) {
    const id = ctx.params.id;

    if (!isValidRouteId(id)) {
      return apiError('Invalid ID format', 'INVALID_PARAMETER', 400);
    }

    try {
      const result = await cachedUSGSService.getInstantaneousValues([id]);

      if (result.data.length === 0) {
        return apiError('Station not found or no data available', 'NOT_FOUND', 404);
      }

      const { 'Cache-Control': _, ...cacheMetaHeaders } = makeCacheHeaders(
        result.cached,
        TTL.USGS_SECONDS,
        result.cachedAt,
      );

      return Response.json(
        {
          success: true,
          data: result.data[0],
          timestamp: new Date().toISOString(),
        },
        { headers: { ...cacheMetaHeaders, 'Cache-Control': CACHE_DYNAMIC } },
      );
    } catch (err) {
      logger.error('Failed to fetch station data', {
        stationId: id,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return apiError(
        'Failed to fetch station data',
        'FETCH_ERROR',
        500,
      );
    }
  },
};
