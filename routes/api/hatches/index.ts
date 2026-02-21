import { type Handlers } from 'fresh';
import { filterHatchesByQuery } from '@shared/data/hatches.ts';
import { apiSuccessList } from '@shared/http/api-response.ts';

export const handler: Handlers = {
  GET(ctx) {
    const url = new URL(ctx.req.url);
    const { hatches } = filterHatchesByQuery({
      order: url.searchParams.get('order'),
      month: url.searchParams.get('month'),
    });

    return apiSuccessList(hatches);
  },
};
