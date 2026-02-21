import { HATCHES } from '@shared/data/hatches.ts';
import { apiError, apiSuccess } from '@shared/http/api-response.ts';
import { isValidRouteId } from '@shared/http/validation.ts';

export const handler = {
  GET(ctx) {
    if (!isValidRouteId(ctx.params.id)) {
      return apiError('Invalid ID format', 'INVALID_PARAMETER', 400);
    }

    const hatch = HATCHES.find((h) => h.id === ctx.params.id);

    if (!hatch) {
      return apiError('Hatch not found', 'NOT_FOUND', 404);
    }

    return apiSuccess(hatch);
  },
};
