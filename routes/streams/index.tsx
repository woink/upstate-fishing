import { Handlers, PageProps } from '$fresh/server.ts';
import type { Stream } from '@shared/models/types.ts';
import { filterStreamsByQuery } from '@shared/data/streams.ts';
import StreamList from '../../islands/StreamList.tsx';

interface StreamsPageData {
  streams: Stream[];
  region?: string;
  state?: string;
  apiUrl: string;
}

export const handler: Handlers<StreamsPageData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const { streams, region, state } = filterStreamsByQuery({
      region: url.searchParams.get('region'),
      state: url.searchParams.get('state'),
    });

    return ctx.render({ streams, region, state, apiUrl: '' });
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

export default function StreamsPage({ data }: PageProps<StreamsPageData>) {
  const { streams, region, state, apiUrl } = data;

  const title = region
    ? `${regionLabels[region] ?? region} Streams`
    : state
    ? `${state} Streams`
    : 'All Streams';

  // Determine which regions to show: all if no state selected, or just the state's regions
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
            href='/streams'
            class={`px-3 py-1 rounded text-sm font-medium ${
              !region && !state ? 'bg-forest-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            All
          </a>
          {states.map((s) => (
            <a
              key={s}
              href={`/streams?state=${s}`}
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
                href={`/streams?region=${key}`}
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

      <StreamList streams={streams} apiUrl={apiUrl} />
    </div>
  );
}
