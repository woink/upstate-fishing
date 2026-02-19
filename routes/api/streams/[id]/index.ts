import { Handlers } from '$fresh/server.ts';
import { getStreamById } from '@shared/data/streams.ts';
import { apiError, apiSuccess } from '../../../../utils/api-response.ts';
import { isValidRouteId } from '../../../../utils/validation.ts';

export const handler: Handlers = {
  GET(_req, ctx) {
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
