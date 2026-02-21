import { Handlers } from '$fresh/server.ts';
import { getStationStats } from '@shared/services/historical.ts';
import { logger } from '@shared/utils/logger.ts';
import { apiError, CACHE_DYNAMIC } from '@shared/http/api-response.ts';
import { isValidRouteId } from '@shared/http/validation.ts';

export const handler: Handlers = {
  async GET(req, ctx) {
    const id = ctx.params.id;

    if (!isValidRouteId(id)) {
      return apiError('Invalid ID format', 'INVALID_PARAMETER', 400);
    }

    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 7, 1), 90) : 7;

    try {
      const stats = await getStationStats(id, days);

      return Response.json(
        {
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        },
        { headers: { 'Cache-Control': CACHE_DYNAMIC } },
      );
    } catch (err) {
      logger.error('Failed to compute station stats', {
        stationId: id,
        error: err instanceof Error ? err.message : String(err),
      });
      return apiError('Failed to compute station stats', 'FETCH_ERROR', 500);
    }
  },
};
