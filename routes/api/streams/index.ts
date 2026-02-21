import { filterStreamsByQuery } from '@shared/data/streams.ts';
import { apiSuccessList } from '@shared/http/api-response.ts';

export const handler = {
  GET(ctx) {
    const url = new URL(ctx.req.url);
    const { streams } = filterStreamsByQuery({
      region: url.searchParams.get('region'),
      state: url.searchParams.get('state'),
    });

    return apiSuccessList(streams);
  },
};
