import { type PageProps } from 'fresh';
import type { Stream } from '@shared/models/types.ts';
import { STREAMS } from '@shared/data/streams.ts';
import StationMap from '../islands/StationMap.tsx';

interface MapPageData {
  streams: Stream[];
  apiUrl: string;
}

export const handler = {
  async GET(ctx) {
    return ctx.render({
      streams: [...STREAMS],
      apiUrl: '',
    });
  },
};

export default function MapPage({ data }: PageProps<MapPageData>) {
  const { streams, apiUrl } = data;

  return (
    <div>
      <h1 class='text-2xl font-bold text-slate-800 mb-4'>Sensor Map</h1>
      <p class='text-slate-600 mb-4'>
        USGS monitoring stations for water temperature, flow, and gage height.
      </p>

      <div class='bg-white rounded-lg shadow overflow-hidden' style={{ height: '600px' }}>
        <StationMap streams={streams} apiUrl={apiUrl} />
      </div>

      <div class='mt-4 flex gap-4 text-sm'>
        <div class='flex items-center gap-2'>
          <span class='w-3 h-3 rounded-full bg-green-500'></span>
          <span>Excellent</span>
        </div>
        <div class='flex items-center gap-2'>
          <span class='w-3 h-3 rounded-full bg-blue-500'></span>
          <span>Good</span>
        </div>
        <div class='flex items-center gap-2'>
          <span class='w-3 h-3 rounded-full bg-yellow-500'></span>
          <span>Fair</span>
        </div>
        <div class='flex items-center gap-2'>
          <span class='w-3 h-3 rounded-full bg-red-500'></span>
          <span>Poor</span>
        </div>
      </div>
    </div>
  );
}
