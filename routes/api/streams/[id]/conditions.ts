import { type RouteHandler } from 'fresh';
import { getStreamById } from '@shared/data/streams.ts';
import { cachedUSGSService } from '@shared/services/cached-usgs.ts';
import { cachedWeatherService } from '@shared/services/cached-weather.ts';
import { predictionService } from '@shared/services/predictions.ts';
import { makeCacheHeaders, TTL } from '@shared/services/cache.ts';
import { logger } from '@shared/utils/logger.ts';
import { apiError, CACHE_DYNAMIC } from '@shared/http/api-response.ts';
import { isValidRouteId } from '@shared/http/validation.ts';

export const handler: RouteHandler = {
  async GET(ctx) {
    if (!isValidRouteId(ctx.params.id)) {
      return apiError('Invalid ID format', 'INVALID_PARAMETER', 400);
    }

    const stream = getStreamById(ctx.params.id);

    if (!stream) {
      return apiError('Stream not found', 'NOT_FOUND', 404);
    }

    try {
      const usgsResult = await cachedUSGSService.getInstantaneousValues(stream.stationIds);

      let weather = null;
      let weatherCached = false;
      let weatherCachedAt: number | null = null;
      if (stream.coordinates) {
        try {
          const weatherResult = await cachedWeatherService.getCurrentConditions(stream.coordinates);
          weather = weatherResult.data;
          weatherCached = weatherResult.cached;
          weatherCachedAt = weatherResult.cachedAt;
        } catch (err) {
          logger.warn('Failed to fetch weather', {
            stream: stream.name,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const conditions = predictionService.generateConditions(stream, usgsResult.data, weather);

      const allCached = usgsResult.cached && (stream.coordinates ? weatherCached : true);
      const cachedTimes = [usgsResult.cachedAt, weatherCachedAt].filter(
        (t): t is number => t !== null,
      );
      const earliestCachedAt = cachedTimes.length > 0 ? Math.min(...cachedTimes) : Date.now();

      const { 'Cache-Control': _, ...cacheMetaHeaders } = makeCacheHeaders(
        allCached,
        TTL.USGS_SECONDS,
        allCached ? earliestCachedAt : null,
      );

      return Response.json(
        {
          success: true,
          data: conditions,
          timestamp: new Date().toISOString(),
        },
        { headers: { ...cacheMetaHeaders, 'Cache-Control': CACHE_DYNAMIC } },
      );
    } catch (err) {
      logger.error('Failed to fetch conditions', {
        streamId: stream.id,
        stream: stream.name,
        stationIds: stream.stationIds,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return apiError(
        'Failed to fetch conditions',
        'FETCH_ERROR',
        500,
      );
    }
  },
};
