import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { Stream, StreamConditions } from "@shared/models/types.ts";

interface StreamListProps {
  streams: Stream[];
  apiUrl: string;
}

const qualityColors = {
  excellent: "border-green-500 bg-green-50",
  good: "border-blue-500 bg-blue-50",
  fair: "border-yellow-500 bg-yellow-50",
  poor: "border-red-500 bg-red-50",
};

const qualityBadges = {
  excellent: "bg-green-500",
  good: "bg-blue-500",
  fair: "bg-yellow-500",
  poor: "bg-red-500",
};

export default function StreamList({ streams, apiUrl }: StreamListProps) {
  const conditionsMap = useSignal<Record<string, StreamConditions>>({});
  const loadingIds = useSignal<Set<string>>(new Set());

  useEffect(() => {
    // Load conditions for all streams
    streams.forEach((stream) => {
      if (conditionsMap.value[stream.id] || loadingIds.value.has(stream.id)) {
        return;
      }

      loadingIds.value = new Set([...loadingIds.value, stream.id]);

      fetch(`${apiUrl}/api/streams/${stream.id}/conditions`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            conditionsMap.value = {
              ...conditionsMap.value,
              [stream.id]: json.data,
            };
          }
        })
        .catch(console.error)
        .finally(() => {
          const newSet = new Set(loadingIds.value);
          newSet.delete(stream.id);
          loadingIds.value = newSet;
        });
    });
  }, [streams, apiUrl]);

  if (streams.length === 0) {
    return (
      <div class="bg-slate-100 rounded-lg p-6 text-center">
        <p class="text-slate-600">No streams found</p>
      </div>
    );
  }

  return (
    <div class="grid gap-4">
      {streams.map((stream) => {
        const conditions = conditionsMap.value[stream.id];
        const isLoading = loadingIds.value.has(stream.id);

        return (
          <a
            key={stream.id}
            href={`/streams/${stream.id}`}
            class={`block bg-white rounded-lg border-l-4 p-4 shadow hover:shadow-md transition ${
              conditions ? qualityColors[conditions.fishingQuality] : "border-slate-300"
            }`}
          >
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-semibold text-lg text-slate-800">{stream.name}</h3>
                <p class="text-sm text-slate-500 capitalize">
                  {stream.region} • {stream.state}
                </p>
              </div>

              {isLoading && (
                <div class="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              )}

              {conditions && (
                <span
                  class={`px-2 py-1 rounded text-xs text-white font-medium ${
                    qualityBadges[conditions.fishingQuality]
                  }`}
                >
                  {conditions.fishingQuality}
                </span>
              )}
            </div>

            {conditions && (
              <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {conditions.stationData[0]?.waterTempF && (
                  <div>
                    <span class="text-slate-500">Water</span>
                    <p class="font-medium">{conditions.stationData[0].waterTempF}°F</p>
                  </div>
                )}
                {conditions.weather && (
                  <div>
                    <span class="text-slate-500">Air</span>
                    <p class="font-medium">{conditions.weather.airTempF}°F</p>
                  </div>
                )}
                {conditions.stationData[0]?.dischargeCfs && (
                  <div>
                    <span class="text-slate-500">Flow</span>
                    <p class="font-medium">{conditions.stationData[0].dischargeCfs} cfs</p>
                  </div>
                )}
                {conditions.predictedHatches.length > 0 && (
                  <div>
                    <span class="text-slate-500">Top Hatch</span>
                    <p class="font-medium">{conditions.predictedHatches[0].hatch.commonName}</p>
                  </div>
                )}
              </div>
            )}

            <div class="mt-2 text-xs text-slate-400">
              {stream.stationIds.length} USGS station{stream.stationIds.length !== 1 ? "s" : ""}
            </div>
          </a>
        );
      })}
    </div>
  );
}
