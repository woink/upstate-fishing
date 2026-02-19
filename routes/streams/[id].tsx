import { Handlers, PageProps } from '$fresh/server.ts';
import type { StreamConditions } from '@shared/models/types.ts';
import { getStreamById } from '@shared/data/streams.ts';
import { cachedUSGSService } from '@shared/services/cached-usgs.ts';
import { cachedWeatherService } from '@shared/services/cached-weather.ts';
import { predictionService } from '@shared/services/predictions.ts';
import { logger } from '@shared/utils/logger.ts';
import StreamConditionsCard from '../../islands/StreamConditionsCard.tsx';

interface StreamDetailData {
  conditions: StreamConditions | null;
  error?: string;
  apiUrl: string;
}

export const handler: Handlers<StreamDetailData> = {
  async GET(_req, ctx) {
    const { id } = ctx.params;
    const stream = getStreamById(id);

    if (!stream) {
      return ctx.render({ conditions: null, error: 'Stream not found', apiUrl: '' });
    }

    try {
      const usgsResult = await cachedUSGSService.getInstantaneousValues(stream.stationIds);

      let weather = null;
      if (stream.coordinates) {
        try {
          const weatherResult = await cachedWeatherService.getCurrentConditions(stream.coordinates);
          weather = weatherResult.data;
        } catch (err) {
          logger.warn('Failed to fetch weather', {
            stream: stream.name,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const conditions = predictionService.generateConditions(stream, usgsResult.data, weather);

      return ctx.render({ conditions, apiUrl: '' });
    } catch (error) {
      logger.error('Failed to fetch stream conditions', {
        streamId: stream.id,
        stream: stream.name,
        stationIds: stream.stationIds,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return ctx.render({ conditions: null, error: 'Failed to fetch conditions', apiUrl: '' });
    }
  },
};

export default function StreamDetail({ data }: PageProps<StreamDetailData>) {
  const { conditions, error, apiUrl } = data;

  if (error || !conditions) {
    return (
      <div class='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
        <p class='text-red-700'>{error ?? 'Stream not found'}</p>
        <a
          href='/streams'
          data-testid='back-to-streams'
          class='text-stream-600 hover:underline mt-2 inline-block'
        >
          ← Back to streams
        </a>
      </div>
    );
  }

  return (
    <div>
      <a
        href='/streams'
        data-testid='back-to-streams'
        class='text-stream-600 hover:underline text-sm mb-4 inline-block'
      >
        ← Back to streams
      </a>

      <StreamConditionsCard conditions={conditions} apiUrl={apiUrl} />
    </div>
  );
}
