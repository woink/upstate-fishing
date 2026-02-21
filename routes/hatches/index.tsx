import { type PageProps } from 'fresh';
import type { Hatch, InsectOrder } from '@shared/models/types.ts';
import { filterHatchesByQuery } from '@shared/data/hatches.ts';
import HatchChart from '../../islands/HatchChart.tsx';

interface HatchesPageData {
  hatches: Hatch[];
  filterOrder: InsectOrder | null;
  filterMonth: number | null;
  error: string | null;
}

export const handler = {
  GET(ctx) {
    const url = new URL(ctx.req.url);
    const { hatches, order: filterOrder, month: filterMonth } = filterHatchesByQuery({
      order: url.searchParams.get('order'),
      month: url.searchParams.get('month'),
    });

    return ctx.render({ hatches, filterOrder, filterMonth, error: null });
  },
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ORDER_LABELS: Record<InsectOrder, string> = {
  mayfly: 'Mayflies',
  caddisfly: 'Caddisflies',
  stonefly: 'Stoneflies',
  midge: 'Midges',
};

export default function HatchesPage({ data }: PageProps<HatchesPageData>) {
  const { hatches, filterOrder, filterMonth, error } = data;
  const currentMonth = new Date().getMonth() + 1;

  // Build page title
  let pageTitle = 'All Hatches';
  if (filterOrder && filterMonth) {
    pageTitle = `${ORDER_LABELS[filterOrder]} in ${MONTH_NAMES[filterMonth - 1]}`;
  } else if (filterOrder) {
    pageTitle = ORDER_LABELS[filterOrder];
  } else if (filterMonth) {
    pageTitle = `${MONTH_NAMES[filterMonth - 1]} Hatches`;
  }

  if (error) {
    return (
      <div>
        <h1 class='text-2xl font-bold text-slate-800 mb-4'>Hatch Chart</h1>
        <div class='bg-red-50 border border-red-200 rounded-lg p-4 text-red-700'>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 class='text-2xl font-bold text-slate-800 mb-2'>Hatch Chart</h1>
      <p class='text-slate-600 mb-6'>
        Insect emergence patterns for Northeast trout streams. Filter by type or month to plan your
        fishing.
      </p>

      {/* Filters */}
      <div class='bg-white rounded-lg shadow p-4 mb-6'>
        <div class='flex flex-wrap gap-4'>
          {/* Order filter */}
          <div>
            <label class='block text-sm font-medium text-slate-700 mb-1'>Insect Type</label>
            <div class='flex flex-wrap gap-2'>
              <a
                href='/hatches'
                class={`px-3 py-1 rounded-full text-sm transition ${
                  !filterOrder
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </a>
              {(['mayfly', 'caddisfly', 'stonefly', 'midge'] as InsectOrder[]).map((order) => (
                <a
                  href={`/hatches?order=${order}${filterMonth ? `&month=${filterMonth}` : ''}`}
                  class={`px-3 py-1 rounded-full text-sm transition ${
                    filterOrder === order
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ORDER_LABELS[order]}
                </a>
              ))}
            </div>
          </div>

          {/* Month filter */}
          <div>
            <label class='block text-sm font-medium text-slate-700 mb-1'>Month</label>
            <select
              data-testid='month-filter'
              class='rounded-lg border border-slate-300 px-3 py-1 text-sm'
              {...{ onchange: 'window.location.href = this.value' }}
            >
              <option value={`/hatches${filterOrder ? `?order=${filterOrder}` : ''}`}>
                All Months
              </option>
              {MONTH_NAMES.map((name, i) => {
                const month = i + 1;
                const href = filterOrder
                  ? `/hatches?order=${filterOrder}&month=${month}`
                  : `/hatches?month=${month}`;
                return (
                  <option value={href} selected={filterMonth === month}>
                    {name} {month === currentMonth ? '(now)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Clear filters */}
          {(filterOrder || filterMonth) && (
            <div class='flex items-end'>
              <a
                href='/hatches'
                class='px-3 py-1 text-sm text-slate-500 hover:text-slate-700'
              >
                ✕ Clear filters
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Results header */}
      <div class='flex justify-between items-center mb-4'>
        <h2 class='text-lg font-semibold text-slate-700'>{pageTitle}</h2>
        <span class='text-sm text-slate-500'>{hatches.length} hatches</span>
      </div>

      {/* Hatch Chart */}
      {hatches.length > 0
        ? <HatchChart hatches={hatches} currentMonth={currentMonth} />
        : (
          <div class='bg-slate-50 rounded-lg p-8 text-center text-slate-500'>
            No hatches found for the selected filters.
          </div>
        )}

      {/* Legend */}
      <div class='mt-6 bg-white rounded-lg shadow p-4'>
        <h3 class='text-sm font-semibold text-slate-700 mb-3'>Legend</h3>
        <div class='flex flex-wrap gap-4 text-sm'>
          <div class='flex items-center gap-2'>
            <span class='w-4 h-4 rounded bg-blue-500'></span>
            <span>Mayflies</span>
          </div>
          <div class='flex items-center gap-2'>
            <span class='w-4 h-4 rounded bg-green-500'></span>
            <span>Caddisflies</span>
          </div>
          <div class='flex items-center gap-2'>
            <span class='w-4 h-4 rounded bg-amber-500'></span>
            <span>Stoneflies</span>
          </div>
          <div class='flex items-center gap-2'>
            <span class='w-4 h-4 rounded bg-violet-500'></span>
            <span>Midges</span>
          </div>
        </div>
        <div class='flex flex-wrap gap-4 text-sm mt-3 pt-3 border-t border-slate-100'>
          <div class='flex items-center gap-2'>
            <span class='w-4 h-4 rounded-full border-2 border-yellow-400 bg-yellow-50'></span>
            <span>Current month</span>
          </div>
          <div class='flex items-center gap-2'>
            <span>☀️</span>
            <span>Prefers sunny</span>
          </div>
          <div class='flex items-center gap-2'>
            <span>☁️</span>
            <span>Prefers overcast</span>
          </div>
        </div>
      </div>
    </div>
  );
}
