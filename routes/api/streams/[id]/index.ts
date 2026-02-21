import { type RouteHandler } from 'fresh';
import { getStreamById } from '@shared/data/streams.ts';
import { apiError, apiSuccess } from '@shared/http/api-response.ts';
import { isValidRouteId } from '@shared/http/validation.ts';

export const handler: RouteHandler = {
  GET(ctx) {
    if (!isValidRouteId(ctx.params.id)) {
      return apiError('Invalid ID format', 'INVALID_PARAMETER', 400);
    }

    const stream = getStreamById(ctx.params.id);

    if (!stream) {
      return apiError('Stream not found', 'NOT_FOUND', 404);
    }

    return apiSuccess(stream);
  },
};
