import { getStationHistory } from '@shared/services/historical.ts';
import { logger } from '@shared/utils/logger.ts';
import { apiError, CACHE_DYNAMIC } from '@shared/http/api-response.ts';
import { isValidRouteId } from '@shared/http/validation.ts';

export const handler = {
  async GET(ctx) {
    const id = ctx.params.id;

    if (!isValidRouteId(id)) {
      return apiError('Invalid ID format', 'INVALID_PARAMETER', 400);
    }

    const url = new URL(ctx.req.url);
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 7, 1), 90) : 7;

    try {
      const history = await getStationHistory(id, days);

      return Response.json(
        {
          success: true,
          data: history,
          count: history.length,
          timestamp: new Date().toISOString(),
        },
        { headers: { 'Cache-Control': CACHE_DYNAMIC } },
      );
    } catch (err) {
      logger.error('Failed to fetch station history', {
        stationId: id,
        error: err instanceof Error ? err.message : String(err),
      });
      return apiError('Failed to fetch station history', 'FETCH_ERROR', 500);
    }
  },
};
