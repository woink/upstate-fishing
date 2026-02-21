import { type RouteHandler } from 'fresh';
import { filterShopsByQuery } from '@shared/data/fly-shops.ts';
import { apiSuccessList } from '@shared/http/api-response.ts';

export const handler: RouteHandler = {
  GET(ctx) {
    const url = new URL(ctx.req.url);
    const { shops } = filterShopsByQuery({
      region: url.searchParams.get('region'),
      state: url.searchParams.get('state'),
    });

    return apiSuccessList(shops);
  },
};
