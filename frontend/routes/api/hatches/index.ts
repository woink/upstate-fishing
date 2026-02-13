import { Handlers } from '$fresh/server.ts';
import { filterHatchesByQuery } from '@shared/data/hatches.ts';
import { apiSuccessList } from '../../../utils/api-response.ts';

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    const { hatches } = filterHatchesByQuery({
      order: url.searchParams.get('order'),
      month: url.searchParams.get('month'),
    });

    return apiSuccessList(hatches);
  },
};
