import { type PageProps } from 'fresh';
import type { FlyShop, Stream } from '@shared/models/types.ts';
import { getShopById } from '@shared/data/fly-shops.ts';
import { STREAMS } from '@shared/data/streams.ts';

interface ShopDetailData {
  shop: FlyShop | null;
  nearbyStreams: Array<{ stream: Stream; distanceMiles: number }>;
  error?: string;
}

/** Haversine distance in miles between two lat/lng points */
function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const handler = {
  GET(ctx) {
    const { id } = ctx.params;
    const shop = getShopById(id);

    if (!shop) {
      return ctx.render(
        { shop: null, nearbyStreams: [], error: 'Fly shop not found' },
        { status: 404 },
      );
    }

    // Find streams within 50 miles, sorted by distance
    const nearbyStreams = STREAMS
      .filter((s) => s.coordinates)
      .map((s) => ({
        stream: s,
        distanceMiles: distanceMiles(
          shop.coordinates.latitude,
          shop.coordinates.longitude,
          s.coordinates!.latitude,
          s.coordinates!.longitude,
        ),
      }))
      .filter((entry) => entry.distanceMiles <= 50)
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    return ctx.render({ shop, nearbyStreams });
  },
};

const regionLabels: Record<string, string> = {
  catskills: 'Catskills',
  delaware: 'Delaware System',
  croton: 'Croton Watershed',
  raritan: 'Raritan / NJ',
  connecticut: 'Connecticut',
  'nc-highcountry': 'NC High Country',
  'nc-foothills': 'NC Foothills',
};

export default function ShopDetail({ data }: PageProps<ShopDetailData>) {
  const { shop, nearbyStreams, error } = data;

  if (error || !shop) {
    return (
      <div class='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
        <p class='text-red-700'>{error ?? 'Fly shop not found'}</p>
        <a
          href='/shops'
          data-testid='back-to-shops'
          class='text-stream-600 hover:underline mt-2 inline-block'
        >
          &larr; Back to fly shops
        </a>
      </div>
    );
  }

  return (
    <div>
      <a
        href='/shops'
        data-testid='back-to-shops'
        class='text-stream-600 hover:underline text-sm mb-4 inline-block'
      >
        &larr; Back to fly shops
      </a>

      <div class='bg-white rounded-lg shadow p-6'>
        <h1 class='text-2xl font-bold text-slate-800'>{shop.name}</h1>
        <p class='text-sm text-slate-500 mt-1'>
          {regionLabels[shop.region] ?? shop.region} &middot; {shop.state}
        </p>

        <div class='mt-4 space-y-2'>
          <p class='text-slate-700'>{shop.address}</p>
          <p class='text-slate-700'>
            <span class='font-medium'>Phone:</span> {shop.phone}
          </p>
          {shop.website && (
            <p>
              <a
                href={shop.website}
                target='_blank'
                rel='noopener noreferrer'
                class='text-stream-600 hover:underline'
              >
                {shop.website}
              </a>
            </p>
          )}
        </div>

        <p class='mt-4 text-slate-600'>{shop.description}</p>
      </div>

      {nearbyStreams.length > 0 && (
        <div class='mt-6'>
          <h2 class='text-xl font-semibold text-slate-800 mb-3'>Nearby Streams</h2>
          <div class='grid gap-3 md:grid-cols-2'>
            {nearbyStreams.map(({ stream, distanceMiles: dist }) => (
              <a
                key={stream.id}
                href={`/streams/${stream.id}`}
                class='block bg-white rounded-lg shadow p-4 hover:shadow-md transition'
              >
                <h3 class='font-medium text-slate-800'>{stream.name}</h3>
                <p class='text-sm text-slate-500'>
                  {regionLabels[stream.region] ?? stream.region} &middot; {dist.toFixed(1)} mi away
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
