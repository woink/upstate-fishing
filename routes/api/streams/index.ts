import { Handlers } from '$fresh/server.ts';
import { filterStreamsByQuery } from '@shared/data/streams.ts';
import { apiSuccessList } from '../../../utils/api-response.ts';

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    const { streams } = filterStreamsByQuery({
      region: url.searchParams.get('region'),
      state: url.searchParams.get('state'),
    });

    return apiSuccessList(streams);
  },
};
