import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { TopPickScore } from '@shared/models/types.ts';
import { qualityClasses, qualityLabels } from '@shared/lib/colors.ts';

function renderStationSummary(pick: TopPickScore) {
  return (
    <div class='text-sm space-y-1 mb-3'>
      {pick.waterTempF != null
        ? <p>💧 Water: {pick.waterTempF}°F</p>
        : <p class='text-slate-400' title='Not monitored at this station'>💧 Water: N/A</p>}
      {pick.airTempF != null && <p>🌡️ Air: {pick.airTempF}°F</p>}
      {pick.dischargeCfs != null
        ? <p>🌊 Flow: {pick.dischargeCfs} cfs</p>
        : <p class='text-slate-400' title='Not monitored at this station'>🌊 Flow: N/A</p>}
    </div>
  );
}

interface TopPicksProps {
  apiUrl: string;
}

export default function TopPicks({ apiUrl }: TopPicksProps) {
  const picks = useSignal<TopPickScore[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);

  useEffect(() => {
    async function fetchTopPicks() {
      loading.value = true;
      error.value = null;

      try {
        const res = await fetch(`${apiUrl}/api/top-picks?count=3`);
        const json = await res.json();

        if (!json.success || !json.data) {
          throw new Error('Failed to fetch top picks');
        }

        picks.value = json.data;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load';
      } finally {
        loading.value = false;
      }
    }

    fetchTopPicks();
  }, [apiUrl]);

  if (loading.value) {
    return (
      <div class='bg-white rounded-lg shadow p-8 text-center'>
        <div class='animate-pulse flex flex-col items-center'>
          <div class='w-12 h-12 bg-slate-200 rounded-full mb-4'></div>
          <div class='h-4 bg-slate-200 rounded w-48'></div>
        </div>
        <p class='text-slate-500 mt-4'>Checking conditions...</p>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
        <p class='text-red-700'>{error.value}</p>
        <button
          type='button'
          onClick={() => globalThis.location.reload()}
          class='mt-2 text-red-600 underline'
        >
          Retry
        </button>
      </div>
    );
  }

  if (picks.value.length === 0) {
    return (
      <div class='bg-slate-100 rounded-lg p-6 text-center'>
        <p class='text-slate-600'>No conditions data available</p>
      </div>
    );
  }

  return (
    <div>
      <h2 class='text-xl font-semibold text-slate-800 mb-4'>🎣 Today's Top Picks</h2>
      <div class='grid md:grid-cols-3 gap-4'>
        {picks.value.map((pick, i) => (
          <a
            key={pick.stream.id}
            href={`/streams/${pick.stream.id}`}
            class={`block rounded-lg border-l-4 p-4 shadow hover:shadow-md transition ${
              qualityClasses[pick.fishingQuality]
            }`}
          >
            <div class='flex items-start justify-between mb-2'>
              <h3 class='font-semibold'>{pick.stream.name}</h3>
              {i === 0 && <span class='text-lg'>⭐</span>}
            </div>

            {renderStationSummary(pick)}

            {pick.topHatches.length > 0 && (
              <div class='text-xs'>
                <span class='font-medium'>Likely hatches:</span>
                {pick.topHatches
                  .slice(0, 2)
                  .map((h) => h.name)
                  .join(', ')}
              </div>
            )}

            <div class='mt-2 text-xs font-medium'>
              {qualityLabels[pick.fishingQuality]}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
