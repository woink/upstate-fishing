import { useSignal } from '@preact/signals';
import type { Hatch, InsectOrder } from '@shared/models/types.ts';

interface HatchChartProps {
  hatches: Hatch[];
  currentMonth: number;
}

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ORDER_COLORS: Record<InsectOrder, { bg: string; border: string; text: string }> = {
  mayfly: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600' },
  caddisfly: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-600' },
  stonefly: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600' },
  midge: { bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-600' },
};

const TIME_LABELS: Record<string, string> = {
  morning: '🌅 Morning',
  midday: '☀️ Midday',
  afternoon: '🌤️ Afternoon',
  evening: '🌆 Evening',
  any: '🕐 Any time',
};

export default function HatchChart({ hatches, currentMonth }: HatchChartProps) {
  const selectedHatch = useSignal<Hatch | null>(null);
  const sortBy = useSignal<'name' | 'month' | 'order'>('month');

  // Sort hatches
  const sortedHatches = [...hatches].sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.commonName.localeCompare(b.commonName);
      case 'order':
        return a.order.localeCompare(b.order) || a.commonName.localeCompare(b.commonName);
      case 'month':
      default: {
        // Sort by earliest peak month, with current month hatches first
        const aInCurrent = a.peakMonths.includes(currentMonth) ? 0 : 1;
        const bInCurrent = b.peakMonths.includes(currentMonth) ? 0 : 1;
        if (aInCurrent !== bInCurrent) return aInCurrent - bInCurrent;
        
        const aMin = Math.min(...a.peakMonths);
        const bMin = Math.min(...b.peakMonths);
        return aMin - bMin || a.commonName.localeCompare(b.commonName);
      }
    }
  });

  const formatHookSizes = (sizes: number[]) => {
    if (sizes.length === 1) return `#${sizes[0]}`;
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    return min === max ? `#${min}` : `#${min}-${max}`;
  };

  return (
    <div class="bg-white rounded-lg shadow overflow-hidden">
      {/* Sort controls */}
      <div class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex gap-2 items-center">
        <span class="text-sm text-slate-500">Sort by:</span>
        {(['month', 'name', 'order'] as const).map((sort) => (
          <button
            onClick={() => sortBy.value = sort}
            class={`px-2 py-1 text-sm rounded transition ${
              sortBy.value === sort
                ? 'bg-slate-700 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {sort.charAt(0).toUpperCase() + sort.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50">
              <th class="text-left p-3 font-medium text-slate-700 sticky left-0 bg-slate-50 min-w-[180px]">
                Hatch
              </th>
              {MONTH_LABELS.map((label, i) => (
                <th
                  class={`p-2 font-medium text-center w-10 ${
                    i + 1 === currentMonth
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'text-slate-500'
                  }`}
                  title={MONTH_NAMES[i]}
                >
                  {label}
                </th>
              ))}
              <th class="p-3 font-medium text-slate-700 text-center min-w-[100px]">Temp</th>
              <th class="p-3 font-medium text-slate-700 text-center min-w-[80px]">Hooks</th>
            </tr>
          </thead>
          <tbody>
            {sortedHatches.map((hatch) => (
              <tr
                class={`border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition ${
                  selectedHatch.value?.id === hatch.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  selectedHatch.value = selectedHatch.value?.id === hatch.id ? null : hatch;
                }}
              >
                {/* Hatch name */}
                <td class="p-3 sticky left-0 bg-inherit">
                  <div class="flex items-center gap-2">
                    <span class={`w-2 h-2 rounded-full ${ORDER_COLORS[hatch.order].bg}`}></span>
                    <span class="font-medium text-slate-800">{hatch.commonName}</span>
                    {hatch.prefersOvercast ? (
                      <span title="Prefers overcast">☁️</span>
                    ) : (
                      <span title="Prefers sunny" class="opacity-50">☀️</span>
                    )}
                  </div>
                  {hatch.scientificName && (
                    <div class="text-xs text-slate-400 italic ml-4">
                      {hatch.scientificName}
                    </div>
                  )}
                </td>

                {/* Month cells */}
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  const isPeak = hatch.peakMonths.includes(month);
                  const isCurrent = month === currentMonth;

                  return (
                    <td
                      class={`p-1 text-center ${
                        isCurrent ? 'bg-yellow-50' : ''
                      }`}
                    >
                      {isPeak && (
                        <div
                          class={`w-6 h-6 mx-auto rounded-full ${ORDER_COLORS[hatch.order].bg} ${
                            isCurrent ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                          }`}
                          title={`${hatch.commonName} - ${MONTH_NAMES[i]}`}
                        />
                      )}
                    </td>
                  );
                })}

                {/* Temperature */}
                <td class="p-3 text-center text-slate-600">
                  {hatch.minTempF}°-{hatch.maxTempF}°F
                </td>

                {/* Hook sizes */}
                <td class="p-3 text-center text-slate-600">
                  {formatHookSizes(hatch.hookSizes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selectedHatch.value && (
        <div class="border-t border-slate-200 p-4 bg-slate-50">
          <div class="flex justify-between items-start">
            <div>
              <h3 class={`text-lg font-semibold ${ORDER_COLORS[selectedHatch.value.order].text}`}>
                {selectedHatch.value.commonName}
              </h3>
              {selectedHatch.value.scientificName && (
                <p class="text-sm text-slate-500 italic">
                  {selectedHatch.value.scientificName}
                </p>
              )}
            </div>
            <button
              onClick={() => selectedHatch.value = null}
              class="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <div class="text-xs text-slate-500 uppercase">Type</div>
              <div class="font-medium capitalize">{selectedHatch.value.order}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 uppercase">Best Time</div>
              <div class="font-medium">{TIME_LABELS[selectedHatch.value.timeOfDay]}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 uppercase">Temperature</div>
              <div class="font-medium">
                {selectedHatch.value.minTempF}°F - {selectedHatch.value.maxTempF}°F
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500 uppercase">Hook Sizes</div>
              <div class="font-medium">{formatHookSizes(selectedHatch.value.hookSizes)}</div>
            </div>
          </div>

          <div class="mt-4">
            <div class="text-xs text-slate-500 uppercase mb-1">Peak Months</div>
            <div class="flex flex-wrap gap-1">
              {selectedHatch.value.peakMonths.map((m) => (
                <span
                  class={`px-2 py-1 rounded text-sm ${
                    m === currentMonth
                      ? 'bg-yellow-200 text-yellow-800 font-medium'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {MONTH_NAMES[m - 1]}
                </span>
              ))}
            </div>
          </div>

          {selectedHatch.value.notes && (
            <div class="mt-4">
              <div class="text-xs text-slate-500 uppercase mb-1">Notes</div>
              <p class="text-sm text-slate-700">{selectedHatch.value.notes}</p>
            </div>
          )}

          {/* Link to streams where this hatch is predicted */}
          <div class="mt-4 pt-4 border-t border-slate-200">
            <a
              href={`/streams?hatch=${selectedHatch.value.id}`}
              class="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              🗺️ View streams with {selectedHatch.value.commonName} activity →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
