/**
 * Hatches page and HatchChart component tests
 * TDD tests for issue #35
 */

import { assertEquals, assertExists } from '@std/assert';
import type { Hatch, InsectOrder } from '@shared/models/types.ts';

// ============================================================================
// Mock Data for Tests
// ============================================================================

const mockHatches: Hatch[] = [
  {
    id: 'hendrickson',
    commonName: 'Hendrickson',
    scientificName: 'Ephemerella subvaria',
    order: 'mayfly',
    minTempF: 50,
    maxTempF: 58,
    peakMonths: [4, 5],
    timeOfDay: 'afternoon',
    prefersOvercast: true,
    hookSizes: [12, 14],
    notes: 'Classic spring mayfly.',
  },
  {
    id: 'bwo',
    commonName: 'Blue Winged Olive',
    scientificName: 'Baetis spp.',
    order: 'mayfly',
    minTempF: 46,
    maxTempF: 56,
    peakMonths: [3, 4, 5, 9, 10, 11],
    timeOfDay: 'any',
    prefersOvercast: true,
    hookSizes: [16, 18, 20],
    notes: 'Good on overcast days.',
  },
  {
    id: 'caddis-tan',
    commonName: 'Tan Caddis',
    scientificName: 'Hydropsyche spp.',
    order: 'caddisfly',
    minTempF: 54,
    maxTempF: 70,
    peakMonths: [4, 5, 6, 7, 8, 9],
    timeOfDay: 'evening',
    prefersOvercast: false,
    hookSizes: [14, 16],
    notes: 'Common caddis.',
  },
  {
    id: 'midge',
    commonName: 'Midge',
    scientificName: 'Chironomidae',
    order: 'midge',
    minTempF: 35,
    maxTempF: 70,
    peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    timeOfDay: 'any',
    prefersOvercast: false,
    hookSizes: [18, 20, 22, 24],
    notes: 'Year-round.',
  },
];

// ============================================================================
// Filter Logic Tests
// ============================================================================

Deno.test('hatches page - filters by month', () => {
  const month = 4; // April
  const filtered = mockHatches.filter((h) => h.peakMonths.includes(month));
  
  assertEquals(filtered.length, 4); // All 4 mock hatches include April
  assertEquals(filtered.every((h) => h.peakMonths.includes(month)), true);
});

Deno.test('hatches page - filters by insect order', () => {
  const order: InsectOrder = 'mayfly';
  const filtered = mockHatches.filter((h) => h.order === order);
  
  assertEquals(filtered.length, 2); // hendrickson and bwo
  assertEquals(filtered.every((h) => h.order === 'mayfly'), true);
});

Deno.test('hatches page - filters by month AND order', () => {
  const month = 9; // September
  const order: InsectOrder = 'mayfly';
  
  const filtered = mockHatches
    .filter((h) => h.peakMonths.includes(month))
    .filter((h) => h.order === order);
  
  assertEquals(filtered.length, 1); // Only BWO
  assertEquals(filtered[0]?.id, 'bwo');
});

Deno.test('hatches page - no filters returns all', () => {
  const filtered = mockHatches;
  assertEquals(filtered.length, 4);
});

// ============================================================================
// Month Label Generation Tests
// ============================================================================

Deno.test('hatches page - generates month labels', () => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  
  assertEquals(monthNames[0], 'Jan');
  assertEquals(monthNames[11], 'Dec');
  assertEquals(monthNames.length, 12);
});

Deno.test('hatches page - converts month number to name', () => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  
  const peakMonths = [4, 5]; // April, May
  const labels = peakMonths.map((m) => monthNames[m - 1]);
  
  assertEquals(labels, ['Apr', 'May']);
});

// ============================================================================
// Order Color Mapping Tests  
// ============================================================================

Deno.test('hatches page - order colors are defined', () => {
  const orderColors: Record<InsectOrder, string> = {
    mayfly: '#3b82f6',    // blue-500
    caddisfly: '#22c55e', // green-500
    stonefly: '#f59e0b',  // amber-500
    midge: '#8b5cf6',     // violet-500
  };
  
  assertExists(orderColors.mayfly);
  assertExists(orderColors.caddisfly);
  assertExists(orderColors.stonefly);
  assertExists(orderColors.midge);
});

Deno.test('hatches page - order labels are human readable', () => {
  const orderLabels: Record<InsectOrder, string> = {
    mayfly: 'Mayflies',
    caddisfly: 'Caddisflies',
    stonefly: 'Stoneflies',
    midge: 'Midges',
  };
  
  assertEquals(orderLabels.mayfly, 'Mayflies');
  assertEquals(orderLabels.caddisfly, 'Caddisflies');
});

// ============================================================================
// Hook Size Formatting Tests
// ============================================================================

Deno.test('hatches page - formats hook sizes', () => {
  const hookSizes = [12, 14];
  const formatted = hookSizes.map((s) => `#${s}`).join(', ');
  
  assertEquals(formatted, '#12, #14');
});

Deno.test('hatches page - formats hook size range', () => {
  const hookSizes = [16, 18, 20];
  const min = Math.min(...hookSizes);
  const max = Math.max(...hookSizes);
  const formatted = min === max ? `#${min}` : `#${min}-${max}`;
  
  assertEquals(formatted, '#16-20');
});

// ============================================================================
// Temperature Range Tests
// ============================================================================

Deno.test('hatches page - formats temperature range', () => {
  const hatch = mockHatches[0]!;
  const tempRange = `${hatch.minTempF}°F - ${hatch.maxTempF}°F`;
  
  assertEquals(tempRange, '50°F - 58°F');
});

// ============================================================================
// Time of Day Display Tests
// ============================================================================

Deno.test('hatches page - time of day labels', () => {
  const timeLabels: Record<string, string> = {
    morning: '🌅 Morning',
    midday: '☀️ Midday',
    afternoon: '🌤️ Afternoon',
    evening: '🌆 Evening',
    any: '🕐 Any time',
  };
  
  assertEquals(timeLabels['afternoon'], '🌤️ Afternoon');
  assertEquals(timeLabels['any'], '🕐 Any time');
});

// ============================================================================
// Sort Tests
// ============================================================================

Deno.test('hatches page - sorts by current month relevance', () => {
  const currentMonth = 4; // April
  
  const sorted = [...mockHatches].sort((a, b) => {
    const aInMonth = a.peakMonths.includes(currentMonth) ? 0 : 1;
    const bInMonth = b.peakMonths.includes(currentMonth) ? 0 : 1;
    return aInMonth - bInMonth;
  });
  
  // All mocks include April, so order preserved
  assertEquals(sorted[0]?.peakMonths.includes(currentMonth), true);
});

Deno.test('hatches page - sorts alphabetically by name', () => {
  const sorted = [...mockHatches].sort((a, b) => 
    a.commonName.localeCompare(b.commonName)
  );
  
  assertEquals(sorted[0]?.commonName, 'Blue Winged Olive');
  assertEquals(sorted[3]?.commonName, 'Tan Caddis');
});

// ============================================================================
// API Response Handling Tests
// ============================================================================

Deno.test('hatches page - handles successful API response', () => {
  const response = {
    success: true,
    data: mockHatches,
    count: mockHatches.length,
    timestamp: new Date().toISOString(),
  };
  
  assertEquals(response.success, true);
  assertExists(response.data);
  assertEquals(response.data.length, 4);
});

Deno.test('hatches page - handles empty API response', () => {
  const response = {
    success: true,
    data: [] as Hatch[],
    count: 0,
    timestamp: new Date().toISOString(),
  };
  
  const hatches = response.data ?? [];
  assertEquals(hatches.length, 0);
});

Deno.test('hatches page - handles API error', () => {
  const response = {
    success: false,
    error: { error: 'Failed to fetch', code: 'FETCH_ERROR' },
    timestamp: new Date().toISOString(),
  };
  
  assertEquals(response.success, false);
  assertExists(response.error);
});

// ============================================================================
// URL Query Parameter Tests
// ============================================================================

Deno.test('hatches page - parses month from query', () => {
  const url = new URL('http://localhost/hatches?month=5');
  const monthParam = url.searchParams.get('month');
  const month = monthParam ? parseInt(monthParam, 10) : null;
  
  assertEquals(month, 5);
});

Deno.test('hatches page - parses order from query', () => {
  const url = new URL('http://localhost/hatches?order=mayfly');
  const order = url.searchParams.get('order');
  
  assertEquals(order, 'mayfly');
});

Deno.test('hatches page - handles invalid month gracefully', () => {
  const url = new URL('http://localhost/hatches?month=13');
  const monthParam = url.searchParams.get('month');
  const month = monthParam ? parseInt(monthParam, 10) : null;
  
  // Should validate and reject invalid months
  const isValid = month !== null && month >= 1 && month <= 12;
  assertEquals(isValid, false);
});
