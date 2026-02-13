import { Handlers } from '$fresh/server.ts';
import { HATCHES } from '@shared/data/hatches.ts';
import { apiError, apiSuccess } from '../../../utils/api-response.ts';

export const handler: Handlers = {
  GET(_req, ctx) {
    const hatch = HATCHES.find((h) => h.id === ctx.params.id);

    if (!hatch) {
      return apiError('Hatch not found', 'NOT_FOUND', 404);
    }

    return apiSuccess(hatch);
  },
};
