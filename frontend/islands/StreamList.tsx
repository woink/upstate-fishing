import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { Stream, StreamConditions } from '@shared/models/types.ts';
import { parameterStatusDisplay, qualityBadgeClasses, qualityClasses } from '../lib/colors.ts';
import { promisePool } from '../lib/promise-pool.ts';

function renderStationData(conditions: StreamConditions) {
  const station = conditions.stationData[0];
  const tempStatus = station?.dataAvailability?.waterTemp ?? 'no_data';
  const tempDisplay = parameterStatusDisplay[tempStatus] ??
    parameterStatusDisplay.no_data;
  const flowStatus = station?.dataAvailability?.discharge ?? 'no_data';
  const flowDisplay = parameterStatusDisplay[flowStatus] ??
    parameterStatusDisplay.no_data;

  return (
    <div class='mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
      <div>
        <span class='text-slate-500'>Water</span>
        {station?.waterTempF != null
          ? <p class='font-medium'>{station.waterTempF}°F</p>
          : (
            <p class={`font-medium ${tempDisplay.classes}`} title={tempDisplay.title}>
              {tempDisplay.text}
            </p>
          )}
      </div>
      {conditions.weather && (
        <div>
          <span class='text-slate-500'>Air</span>
          <p class='font-medium'>{conditions.weather.airTempF}°F</p>
        </div>
      )}
      <div>
        <span class='text-slate-500'>Flow</span>
        {station?.dischargeCfs != null
          ? <p class='font-medium'>{station.dischargeCfs} cfs</p>
          : (
            <p class={`font-medium ${flowDisplay.classes}`} title={flowDisplay.title}>
              {flowDisplay.text}
            </p>
          )}
      </div>
      {conditions.predictedHatches.length > 0 && (
        <div>
          <span class='text-slate-500'>Top Hatch</span>
          <p class='font-medium'>{conditions.predictedHatches[0].hatch.commonName}</p>
        </div>
      )}
    </div>
  );
}

interface StreamListProps {
  streams: Stream[];
  apiUrl: string;
}

export default function StreamList({ streams, apiUrl }: StreamListProps) {
  const conditionsMap = useSignal<Record<string, StreamConditions>>({});
  const loadingIds = useSignal<Set<string>>(new Set());
  const errorIds = useSignal<Set<string>>(new Set());

  useEffect(() => {
    const streamsToLoad = streams.filter(
      (s) => !conditionsMap.value[s.id] && !loadingIds.value.has(s.id),
    );
    if (streamsToLoad.length === 0) return;

    // Mark all as loading
    loadingIds.value = new Set([...loadingIds.value, ...streamsToLoad.map((s) => s.id)]);

    const tasks = streamsToLoad.map((stream) => async () => {
      const res = await fetch(`${apiUrl}/api/streams/${stream.id}/conditions`);
      const json = await res.json();
      return { streamId: stream.id, json };
    });

    promisePool(tasks, 4).then((results) => {
      const newConditions: Record<string, StreamConditions> = {};
      const newErrors = new Set(errorIds.value);
      const doneIds = new Set(loadingIds.value);

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { streamId, json } = result.value;
          doneIds.delete(streamId);
          if (json.success && json.data) {
            newConditions[streamId] = json.data;
            newErrors.delete(streamId);
          } else {
            newErrors.add(streamId);
          }
        } else {
          // Rejected — find the stream ID from the task index
          const idx = results.indexOf(result);
          const streamId = streamsToLoad[idx]?.id;
          if (streamId) {
            doneIds.delete(streamId);
            newErrors.add(streamId);
          }
        }
      }

      conditionsMap.value = { ...conditionsMap.value, ...newConditions };
      loadingIds.value = doneIds;
      errorIds.value = newErrors;
    });
  }, [streams, apiUrl]);

  if (streams.length === 0) {
    return (
      <div class='bg-slate-100 rounded-lg p-6 text-center'>
        <p class='text-slate-600'>No streams found</p>
      </div>
    );
  }

  return (
    <div class='grid gap-4'>
      {streams.map((stream) => {
        const conditions = conditionsMap.value[stream.id];
        const isLoading = loadingIds.value.has(stream.id);
        const hasError = errorIds.value.has(stream.id);

        return (
          <a
            key={stream.id}
            href={`/streams/${stream.id}`}
            class={`block bg-white rounded-lg border-l-4 p-4 shadow hover:shadow-md transition ${
              conditions
                ? qualityClasses[conditions.fishingQuality]
                : hasError
                ? 'border-red-300'
                : 'border-slate-300'
            }`}
          >
            <div class='flex items-start justify-between'>
              <div>
                <h3 class='font-semibold text-lg text-slate-800'>{stream.name}</h3>
                <p class='text-sm text-slate-500 capitalize'>
                  {stream.region} • {stream.state}
                </p>
              </div>

              {isLoading && (
                <div class='w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin'>
                </div>
              )}

              {conditions && (
                <span
                  class={`px-2 py-1 rounded text-xs text-white font-medium ${
                    qualityBadgeClasses[conditions.fishingQuality]
                  }`}
                >
                  {conditions.fishingQuality}
                </span>
              )}
            </div>

            {conditions && renderStationData(conditions)}

            {hasError && !conditions && (
              <p class='mt-2 text-sm text-red-700'>
                Failed to load conditions
              </p>
            )}

            <div class='mt-2 text-xs text-slate-400'>
              {stream.stationIds.length} USGS station{stream.stationIds.length !== 1 ? 's' : ''}
            </div>
          </a>
        );
      })}
    </div>
  );
}
