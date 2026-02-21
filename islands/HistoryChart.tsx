import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

interface TimeSeriesPoint {
  timestamp: string;
  waterTempF: number | null;
  dischargeCfs: number | null;
  gageHeightFt: number | null;
}

interface HistoryChartProps {
  stationId: string;
  apiUrl: string;
}

const CHART_W = 600;
const CHART_H = 200;
const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };
const INNER_W = CHART_W - PADDING.left - PADDING.right;
const INNER_H = CHART_H - PADDING.top - PADDING.bottom;

type Metric = 'waterTempF' | 'dischargeCfs';

const METRIC_LABELS: Record<Metric, { label: string; unit: string; color: string }> = {
  waterTempF: { label: 'Water Temp', unit: '°F', color: '#0ea5e9' },
  dischargeCfs: { label: 'Discharge', unit: 'cfs', color: '#22c55e' },
};

function buildPath(
  points: TimeSeriesPoint[],
  metric: Metric,
  minTime: number,
  maxTime: number,
  minVal: number,
  maxVal: number,
): string {
  const validPoints = points
    .map((p) => ({ t: new Date(p.timestamp).getTime(), v: p[metric] }))
    .filter((p): p is { t: number; v: number } => p.v !== null);

  if (validPoints.length < 2) return '';

  const rangeT = maxTime - minTime || 1;
  const rangeV = maxVal - minVal || 1;

  return validPoints
    .map((p, i) => {
      const x = PADDING.left + ((p.t - minTime) / rangeT) * INNER_W;
      const y = PADDING.top + INNER_H - ((p.v - minVal) / rangeV) * INNER_H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function HistoryChart({ stationId, apiUrl }: HistoryChartProps) {
  const points = useSignal<TimeSeriesPoint[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const metric = useSignal<Metric>('waterTempF');
  const days = useSignal(7);

  useEffect(() => {
    async function fetchHistory() {
      loading.value = true;
      error.value = null;

      try {
        const res = await fetch(
          `${apiUrl}/api/stations/${stationId}/history?days=${days.value}`,
        );
        const json = await res.json();

        if (!json.success || !json.data) {
          throw new Error('No historical data available');
        }

        points.value = json.data;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load history';
      } finally {
        loading.value = false;
      }
    }

    fetchHistory();
  }, [stationId, apiUrl, days.value]);

  if (loading.value) {
    return (
      <div class='bg-white rounded-lg shadow p-6'>
        <div class='animate-pulse h-48 bg-slate-100 rounded' />
      </div>
    );
  }

  if (error.value || points.value.length < 2) {
    return (
      <div class='bg-slate-50 rounded-lg p-6 text-center text-sm text-slate-500'>
        {error.value ?? 'Not enough historical data to chart yet.'}
      </div>
    );
  }

  const m = metric.value;
  const info = METRIC_LABELS[m];
  const vals = points.value.map((p) => p[m]).filter((v): v is number => v !== null);

  if (vals.length < 2) {
    return (
      <div class='bg-slate-50 rounded-lg p-6 text-center text-sm text-slate-500'>
        No {info.label.toLowerCase()} data available for this station.
      </div>
    );
  }

  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const times = points.value.map((p) => new Date(p.timestamp).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  const path = buildPath(points.value, m, minTime, maxTime, minVal, maxVal);

  // Y-axis labels (3 ticks)
  const yMid = Math.round(((minVal + maxVal) / 2) * 10) / 10;

  // X-axis labels (start, mid, end)
  const midTime = new Date((minTime + maxTime) / 2).toISOString();

  return (
    <div class='bg-white rounded-lg shadow p-4'>
      <div class='flex items-center justify-between mb-3'>
        <h3 class='text-sm font-semibold text-slate-700'>History</h3>
        <div class='flex gap-2'>
          <select
            class='text-xs border rounded px-2 py-1 text-slate-600'
            value={m}
            onChange={(e) => {
              metric.value = (e.target as HTMLSelectElement).value as Metric;
            }}
          >
            <option value='waterTempF'>Water Temp</option>
            <option value='dischargeCfs'>Discharge</option>
          </select>
          <select
            class='text-xs border rounded px-2 py-1 text-slate-600'
            value={days.value}
            onChange={(e) => {
              days.value = parseInt((e.target as HTMLSelectElement).value, 10);
            }}
          >
            <option value='7'>7 days</option>
            <option value='30'>30 days</option>
            <option value='90'>90 days</option>
          </select>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        class='w-full'
        preserveAspectRatio='xMidYMid meet'
      >
        {/* Grid lines */}
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + INNER_H}
          stroke='#e2e8f0'
          stroke-width='1'
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top + INNER_H}
          x2={PADDING.left + INNER_W}
          y2={PADDING.top + INNER_H}
          stroke='#e2e8f0'
          stroke-width='1'
        />

        {/* Y-axis labels */}
        <text
          x={PADDING.left - 5}
          y={PADDING.top + 4}
          text-anchor='end'
          fill='#94a3b8'
          font-size='10'
        >
          {maxVal}
          {info.unit}
        </text>
        <text
          x={PADDING.left - 5}
          y={PADDING.top + INNER_H / 2 + 4}
          text-anchor='end'
          fill='#94a3b8'
          font-size='10'
        >
          {yMid}
          {info.unit}
        </text>
        <text
          x={PADDING.left - 5}
          y={PADDING.top + INNER_H + 4}
          text-anchor='end'
          fill='#94a3b8'
          font-size='10'
        >
          {minVal}
          {info.unit}
        </text>

        {/* X-axis labels */}
        <text
          x={PADDING.left}
          y={PADDING.top + INNER_H + 18}
          text-anchor='start'
          fill='#94a3b8'
          font-size='10'
        >
          {formatDate(points.value[0].timestamp)}
        </text>
        <text
          x={PADDING.left + INNER_W / 2}
          y={PADDING.top + INNER_H + 18}
          text-anchor='middle'
          fill='#94a3b8'
          font-size='10'
        >
          {formatDate(midTime)}
        </text>
        <text
          x={PADDING.left + INNER_W}
          y={PADDING.top + INNER_H + 18}
          text-anchor='end'
          fill='#94a3b8'
          font-size='10'
        >
          {formatDate(points.value[points.value.length - 1].timestamp)}
        </text>

        {/* Data line */}
        {path && (
          <path d={path} fill='none' stroke={info.color} stroke-width='2' stroke-linejoin='round' />
        )}
      </svg>
    </div>
  );
}
