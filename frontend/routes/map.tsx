import { Handlers, PageProps } from '$fresh/server.ts';
import type { Stream } from '@shared/models/types.ts';
import StationMap from '../islands/StationMap.tsx';

interface MapPageData {
  streams: Stream[];
  apiUrl: string;
}

export const handler: Handlers<MapPageData> = {
  async GET(_req, ctx) {
    const backendUrl = Deno.env.get('API_URL') ?? 'http://localhost:8000';

    try {
      const response = await fetch(`${backendUrl}/api/streams`);
      const json = await response.json();

      return ctx.render({
        streams: json.data ?? [],
        apiUrl: '', // Relative URL for client-side fetches via proxy
      });
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      return ctx.render({
        streams: [],
        apiUrl: '', // Relative URL for client-side fetches via proxy
      });
    }
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
