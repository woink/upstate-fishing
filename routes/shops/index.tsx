import { Handlers, PageProps } from '$fresh/server.ts';
import type { FlyShop } from '@shared/models/types.ts';
import { filterShopsByQuery } from '@shared/data/fly-shops.ts';

interface ShopsPageData {
  shops: FlyShop[];
  region?: string;
  state?: string;
}

export const handler: Handlers<ShopsPageData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const { shops, region, state } = filterShopsByQuery({
      region: url.searchParams.get('region'),
      state: url.searchParams.get('state'),
    });

    return ctx.render({ shops, region, state });
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

const stateToRegions: Record<string, string[]> = {
  NY: ['catskills', 'delaware', 'croton'],
  NJ: ['raritan'],
  CT: ['connecticut'],
  NC: ['nc-highcountry', 'nc-foothills'],
};

const states = ['NY', 'NJ', 'CT', 'NC'];

export default function ShopsPage({ data }: PageProps<ShopsPageData>) {
  const { shops, region, state } = data;

  const title = region
    ? `${regionLabels[region] ?? region} Fly Shops`
    : state
    ? `${state} Fly Shops`
    : 'All Fly Shops';

  const visibleRegions = state ? stateToRegions[state] ?? [] : Object.keys(regionLabels);

  return (
    <div>
      <div class='mb-6'>
        <div class='flex items-center justify-between mb-3'>
          <h1 class='text-2xl font-bold text-slate-800'>{title}</h1>
        </div>

        {/* Row 1: State tabs */}
        <div class='flex gap-2 mb-2'>
          <a
            href='/shops'
            class={`px-3 py-1 rounded text-sm font-medium ${
              !region && !state ? 'bg-forest-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            All
          </a>
          {states.map((s) => (
            <a
              key={s}
              href={`/shops?state=${s}`}
              class={`px-3 py-1 rounded text-sm font-medium ${
                state === s ? 'bg-forest-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {s}
            </a>
          ))}
        </div>

        {/* Row 2: Region buttons */}
        {visibleRegions.length > 0 && (
          <div class='flex flex-wrap gap-2'>
            {visibleRegions.map((key) => (
              <a
                key={key}
                href={`/shops?region=${key}`}
                class={`px-3 py-1 rounded text-sm ${
                  region === key
                    ? 'bg-stream-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {regionLabels[key]}
              </a>
            ))}
          </div>
        )}
      </div>

      <div class='grid gap-4 md:grid-cols-2'>
        {shops.map((shop) => (
          <a
            key={shop.id}
            href={`/shops/${shop.id}`}
            class='block bg-white rounded-lg shadow p-4 hover:shadow-md transition'
          >
            <h2 class='text-lg font-semibold text-slate-800'>{shop.name}</h2>
            <p class='text-sm text-slate-500 mt-1'>
              {regionLabels[shop.region] ?? shop.region} &middot; {shop.state}
            </p>
            <p class='text-sm text-slate-600 mt-2'>{shop.address}</p>
            <p class='text-sm text-slate-600'>{shop.phone}</p>
          </a>
        ))}
      </div>

      {shops.length === 0 && (
        <p class='text-slate-500 text-center py-8'>No fly shops found for this filter.</p>
      )}
    </div>
  );
}
