import { Handlers } from '$fresh/server.ts';
import { getStreamById } from '@shared/data/streams.ts';
import { apiSuccess, apiError } from '../../../../utils/api-response.ts';

export const handler: Handlers = {
  GET(_req, ctx) {
    const stream = getStreamById(ctx.params.id);

    if (!stream) {
      return apiError('Stream not found', 'NOT_FOUND', 404);
    }

    return apiSuccess(stream);
  },
};
