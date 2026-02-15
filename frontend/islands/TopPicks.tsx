import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { StreamConditions } from '@shared/models/types.ts';
import {
  parameterStatusDisplay,
  qualityClasses,
  qualityLabels,
  qualityOrder,
} from '../lib/colors.ts';

interface TopPicksProps {
  apiUrl: string;
}

export default function TopPicks({ apiUrl }: TopPicksProps) {
  const conditions = useSignal<StreamConditions[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);

  useEffect(() => {
    async function fetchConditions() {
      loading.value = true;
      error.value = null;

      try {
        // Fetch all streams first
        const streamsRes = await fetch(`${apiUrl}/api/streams`);
        const streamsJson = await streamsRes.json();

        if (!streamsJson.success || !streamsJson.data) {
          throw new Error('Failed to fetch streams');
        }

        // Fetch conditions for each stream (in parallel, limited)
        const streams = streamsJson.data.slice(0, 6); // Limit to 6 for speed
        const conditionPromises = streams.map(async (stream: { id: string }) => {
          try {
            const res = await fetch(`${apiUrl}/api/streams/${stream.id}/conditions`);
            const json = await res.json();
            return json.success ? json.data : null;
          } catch {
            return null;
          }
        });

        const results = await Promise.all(conditionPromises);
        const validConditions = results.filter((c): c is StreamConditions => c !== null);

        // Sort by fishing quality
        validConditions.sort((a, b) =>
          qualityOrder[a.fishingQuality] - qualityOrder[b.fishingQuality]
        );

        conditions.value = validConditions.slice(0, 3); // Top 3
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load';
      } finally {
        loading.value = false;
      }
    }

    fetchConditions();
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

  if (conditions.value.length === 0) {
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
        {conditions.value.map((cond, i) => (
          <a
            key={cond.stream.id}
            href={`/streams/${cond.stream.id}`}
            class={`block rounded-lg border-l-4 p-4 shadow hover:shadow-md transition ${
              qualityClasses[cond.fishingQuality]
            }`}
          >
            <div class='flex items-start justify-between mb-2'>
              <h3 class='font-semibold'>{cond.stream.name}</h3>
              {i === 0 && <span class='text-lg'>⭐</span>}
            </div>

            {(() => {
              const station = cond.stationData[0];
              const tempStatus = station?.dataAvailability?.waterTemp ?? 'no_data';
              const tempDisplay = parameterStatusDisplay[tempStatus] ??
                parameterStatusDisplay.no_data;
              const flowStatus = station?.dataAvailability?.discharge ?? 'no_data';
              const flowDisplay = parameterStatusDisplay[flowStatus] ??
                parameterStatusDisplay.no_data;

              return (
                <div class='text-sm space-y-1 mb-3'>
                  {station?.waterTempF != null
                    ? <p>💧 Water: {station.waterTempF}°F</p>
                    : (
                      <p class={tempDisplay.classes} title={tempDisplay.title}>
                        💧 Water: {tempDisplay.text || 'N/A'}
                      </p>
                    )}
                  {cond.weather && <p>🌡️ Air: {cond.weather.airTempF}°F</p>}
                  {station?.dischargeCfs != null
                    ? <p>🌊 Flow: {station.dischargeCfs} cfs</p>
                    : (
                      <p class={flowDisplay.classes} title={flowDisplay.title}>
                        🌊 Flow: {flowDisplay.text || 'N/A'}
                      </p>
                    )}
                </div>
              );
            })()}

            {cond.predictedHatches.length > 0 && (
              <div class='text-xs'>
                <span class='font-medium'>Likely hatches:</span>
                {cond.predictedHatches
                  .slice(0, 2)
                  .map((p) => p.hatch.commonName)
                  .join(', ')}
              </div>
            )}

            <div class='mt-2 text-xs font-medium'>
              {qualityLabels[cond.fishingQuality]}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
