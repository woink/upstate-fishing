import { Handlers } from '$fresh/server.ts';
import { STREAMS, getStreamsByRegion, getStreamsByState } from '@shared/data/streams.ts';
import type { Region, State } from '@shared/models/types.ts';
import { apiSuccessList } from '../../../utils/api-response.ts';

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    const region = url.searchParams.get('region') as Region | undefined ?? undefined;
    const state = url.searchParams.get('state') as State | undefined ?? undefined;

    let streams = [...STREAMS];
    if (region) {
      streams = getStreamsByRegion(region);
    } else if (state) {
      streams = getStreamsByState(state);
    }

    return apiSuccessList(streams);
  },
};
