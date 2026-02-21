import { Handlers } from '$fresh/server.ts';
import { STREAMS } from '@shared/data/streams.ts';
import { apiError, apiSuccessList } from '@shared/http/api-response.ts';
import { haversineDistance } from '@shared/utils/distance.ts';
import type { NearbyStream } from '@shared/models/types.ts';

const DEFAULT_RADIUS_MILES = 50;
const MAX_RADIUS_MILES = 500;

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);

    const latStr = url.searchParams.get('lat');
    const lonStr = url.searchParams.get('lon');
    const radiusStr = url.searchParams.get('radius');

    if (!latStr || !lonStr) {
      return apiError('lat and lon query parameters are required', 'MISSING_PARAMS', 400);
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return apiError('lat must be a number between -90 and 90', 'INVALID_PARAM', 400);
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return apiError('lon must be a number between -180 and 180', 'INVALID_PARAM', 400);
    }

    let radius = DEFAULT_RADIUS_MILES;
    if (radiusStr) {
      radius = parseFloat(radiusStr);
      if (isNaN(radius) || radius <= 0 || radius > MAX_RADIUS_MILES) {
        return apiError(
          `radius must be a positive number up to ${MAX_RADIUS_MILES}`,
          'INVALID_PARAM',
          400,
        );
      }
    }

    const origin = { latitude: lat, longitude: lon };

    const results: NearbyStream[] = STREAMS
      .filter((s) => s.coordinates !== undefined)
      .map((s) => {
        const dist = haversineDistance(origin, s.coordinates!);
        return {
          streamId: s.id,
          name: s.name,
          region: s.region,
          state: s.state,
          latitude: s.coordinates!.latitude,
          longitude: s.coordinates!.longitude,
          distanceMiles: Math.round(dist * 10) / 10,
        };
      })
      .filter((s) => s.distanceMiles <= radius)
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    return apiSuccessList(results);
  },
};
