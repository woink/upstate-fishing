import { useSignal } from '@preact/signals';
import type { StreamConditions } from '@shared/models/types.ts';

interface StreamConditionsCardProps {
  conditions: StreamConditions;
  apiUrl: string;
}

const qualityColors = {
  excellent: 'bg-green-100 border-green-500',
  good: 'bg-blue-100 border-blue-500',
  fair: 'bg-yellow-100 border-yellow-500',
  poor: 'bg-red-100 border-red-500',
};

const confidenceColors = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-slate-400',
};

export default function StreamConditionsCard({
  conditions: initial,
  apiUrl,
}: StreamConditionsCardProps) {
  const conditions = useSignal(initial);
  const refreshing = useSignal(false);

  async function refresh() {
    refreshing.value = true;
    try {
      const res = await fetch(`${apiUrl}/api/streams/${initial.stream.id}/conditions`);
      const json = await res.json();
      if (json.success && json.data) {
        conditions.value = json.data;
      }
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      refreshing.value = false;
    }
  }

  const cond = conditions.value;

  return (
    <div class={`rounded-lg border-l-4 shadow-lg ${qualityColors[cond.fishingQuality]}`}>
      {/* Header */}
      <div class='p-6 border-b border-slate-200'>
        <div class='flex items-start justify-between'>
          <div>
            <h1 class='text-2xl font-bold text-slate-800'>{cond.stream.name}</h1>
            <p class='text-slate-600 capitalize'>
              {cond.stream.region} • {cond.stream.state}
            </p>
          </div>
          <button
            type='button'
            onClick={refresh}
            disabled={refreshing.value}
            class='p-2 rounded-full hover:bg-white/50 transition disabled:opacity-50'
            title='Refresh conditions'
          >
            <span class={refreshing.value ? 'animate-spin inline-block' : ''}>🔄</span>
          </button>
        </div>

        <div class='mt-4'>
          <span class='text-lg font-semibold capitalize'>{cond.fishingQuality} Conditions</span>
          <p class='text-slate-600 mt-1'>{cond.summary}</p>
        </div>
      </div>

      {/* Current Data */}
      <div class='p-6 bg-white'>
        <h2 class='text-lg font-semibold text-slate-800 mb-4'>Current Readings</h2>

        <div class='grid md:grid-cols-2 gap-6'>
          {/* Water Data */}
          <div class='space-y-3'>
            <h3 class='font-medium text-slate-700'>💧 Water Conditions</h3>
            {cond.stationData.map((station) => (
              <div key={station.stationId} class='bg-slate-50 rounded p-3 text-sm'>
                <p class='text-slate-500 text-xs mb-2'>{station.stationName}</p>
                <div class='grid grid-cols-3 gap-2'>
                  {station.waterTempF && (
                    <div>
                      <span class='text-slate-500 block'>Temp</span>
                      <span class='font-semibold'>{station.waterTempF}°F</span>
                    </div>
                  )}
                  {station.dischargeCfs && (
                    <div>
                      <span class='text-slate-500 block'>Flow</span>
                      <span class='font-semibold'>{station.dischargeCfs} cfs</span>
                    </div>
                  )}
                  {station.gageHeightFt && (
                    <div>
                      <span class='text-slate-500 block'>Gage</span>
                      <span class='font-semibold'>{station.gageHeightFt} ft</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Weather */}
          {cond.weather && (
            <div class='space-y-3'>
              <h3 class='font-medium text-slate-700'>🌤️ Weather</h3>
              <div class='bg-slate-50 rounded p-3'>
                <p class='font-semibold'>{cond.weather.shortForecast}</p>
                <div class='grid grid-cols-2 gap-2 mt-2 text-sm'>
                  <div>
                    <span class='text-slate-500'>Air Temp:</span>{' '}
                    <span class='font-medium'>{cond.weather.airTempF}°F</span>
                  </div>
                  <div>
                    <span class='text-slate-500'>Wind:</span>{' '}
                    <span class='font-medium'>{cond.weather.windSpeedMph} mph</span>
                  </div>
                  <div>
                    <span class='text-slate-500'>Cloud Cover:</span>{' '}
                    <span class='font-medium'>{cond.weather.cloudCoverPercent}%</span>
                  </div>
                  <div>
                    <span class='text-slate-500'>Precip:</span>{' '}
                    <span class='font-medium'>{cond.weather.precipProbability}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hatch Predictions */}
      {cond.predictedHatches.length > 0 && (
        <div class='p-6 border-t border-slate-200'>
          <h2 class='text-lg font-semibold text-slate-800 mb-4'>🪰 Predicted Hatches</h2>
          <div class='space-y-3'>
            {cond.predictedHatches.map((pred) => (
              <div
                key={pred.hatch.id}
                class='bg-white border rounded-lg p-4 flex items-start justify-between'
              >
                <div class='flex-1'>
                  <div class='flex items-center gap-2'>
                    <h3 class='font-semibold'>{pred.hatch.commonName}</h3>
                    <span
                      class={`px-2 py-0.5 rounded text-xs text-white ${
                        confidenceColors[pred.confidence]
                      }`}
                    >
                      {pred.confidence}
                    </span>
                  </div>
                  {pred.hatch.scientificName && (
                    <p class='text-slate-500 text-sm italic'>{pred.hatch.scientificName}</p>
                  )}
                  <p class='text-sm text-slate-600 mt-1'>{pred.reasoning}</p>
                  <div class='text-xs text-slate-500 mt-2'>
                    <span class='capitalize'>{pred.hatch.order}</span> • Hook sizes:{' '}
                    {pred.hatch.hookSizes.join(', ')} • {pred.hatch.timeOfDay} emergence
                  </div>
                </div>
                <div class='text-right'>
                  <span class='text-2xl font-bold text-slate-700'>
                    {Math.round(pred.probability * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div class='p-4 bg-slate-100 text-xs text-slate-500 rounded-b-lg'>
        Last updated: {new Date(cond.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
