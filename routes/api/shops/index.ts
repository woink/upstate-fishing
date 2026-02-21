import { Handlers } from '$fresh/server.ts';
import { filterShopsByQuery } from '@shared/data/fly-shops.ts';
import { apiSuccessList } from '@shared/http/api-response.ts';

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    const { shops } = filterShopsByQuery({
      region: url.searchParams.get('region'),
      state: url.searchParams.get('state'),
    });

    return apiSuccessList(shops);
  },
};
