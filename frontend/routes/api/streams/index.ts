import { Handlers } from '$fresh/server.ts';
import { getStreamsByRegion, getStreamsByState, STREAMS } from '@shared/data/streams.ts';
import { RegionSchema, StateSchema } from '@shared/models/types.ts';
import { apiSuccessList } from '../../../utils/api-response.ts';

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    const regionParsed = RegionSchema.safeParse(url.searchParams.get('region'));
    const stateParsed = StateSchema.safeParse(url.searchParams.get('state'));

    let streams = [...STREAMS];
    if (regionParsed.success) {
      streams = getStreamsByRegion(regionParsed.data);
    } else if (stateParsed.success) {
      streams = getStreamsByState(stateParsed.data);
    }

    return apiSuccessList(streams);
  },
};
