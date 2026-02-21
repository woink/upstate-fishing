import { getTopPicks } from '@shared/services/top-picks.ts';
import { logger } from '@shared/utils/logger.ts';
import { apiError, CACHE_DYNAMIC } from '@shared/http/api-response.ts';

export const handler = {
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const countParam = url.searchParams.get('count');
    const count = countParam ? Math.min(Math.max(parseInt(countParam, 10) || 5, 1), 10) : 5;

    try {
      const picks = await getTopPicks(count);

      return Response.json(
        {
          success: true,
          data: picks,
          count: picks.length,
          timestamp: new Date().toISOString(),
        },
        { headers: { 'Cache-Control': CACHE_DYNAMIC } },
      );
    } catch (err) {
      logger.error('Failed to compute top picks', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return apiError('Failed to compute top picks', 'FETCH_ERROR', 500);
    }
  },
};
