/**
 * Hatch data tests
 */

import { assertEquals, assertExists } from '@std/assert';
import {
  filterHatchesByQuery,
  getHatchesByMonth,
  getHatchesByOrder,
  getHatchesByTemp,
  HATCHES,
} from '../src/data/hatches.ts';

// ============================================================================
// HATCHES Data Tests
// ============================================================================

Deno.test('HATCHES - contains expected number of hatches', () => {
  // Should have at least 15 hatches
  assertEquals(HATCHES.length >= 15, true, 'Should have at least 15 hatches');
});

Deno.test('HATCHES - all hatches have required fields', () => {
  for (const hatch of HATCHES) {
    assertExists(hatch.id, `Hatch missing id`);
    assertExists(hatch.commonName, `Hatch ${hatch.id} missing commonName`);
    assertExists(hatch.order, `Hatch ${hatch.id} missing order`);
    assertEquals(typeof hatch.minTempF === 'number', true, `Hatch ${hatch.id} missing minTempF`);
    assertEquals(typeof hatch.maxTempF === 'number', true, `Hatch ${hatch.id} missing maxTempF`);
    assertEquals(hatch.peakMonths.length > 0, true, `Hatch ${hatch.id} missing peakMonths`);
    assertEquals(hatch.hookSizes.length > 0, true, `Hatch ${hatch.id} missing hookSizes`);
  }
});

Deno.test('HATCHES - all hatch IDs are unique', () => {
  const ids = HATCHES.map((h) => h.id);
  const uniqueIds = new Set(ids);
  assertEquals(ids.length, uniqueIds.size, 'Hatch IDs should be unique');
});

Deno.test('HATCHES - minTempF is less than maxTempF', () => {
  for (const hatch of HATCHES) {
    assertEquals(
      hatch.minTempF < hatch.maxTempF,
      true,
      `Hatch ${hatch.id}: minTempF should be less than maxTempF`,
    );
  }
});

Deno.test('HATCHES - peakMonths are valid (1-12)', () => {
  for (const hatch of HATCHES) {
    for (const month of hatch.peakMonths) {
      assertEquals(
        month >= 1 && month <= 12,
        true,
        `Hatch ${hatch.id}: invalid month ${month}`,
      );
    }
  }
});

Deno.test('HATCHES - contains iconic hatches', () => {
  const hatchIds = HATCHES.map((h) => h.id);
  assertEquals(hatchIds.includes('hendrickson'), true, 'Should include Hendrickson');
  assertEquals(hatchIds.includes('bwo'), true, 'Should include BWO');
  assertEquals(hatchIds.includes('green-drake'), true, 'Should include Green Drake');
  assertEquals(hatchIds.includes('midge'), true, 'Should include Midge');
});

// ============================================================================
// getHatchesByMonth Tests
// ============================================================================

Deno.test('getHatchesByMonth - April includes Hendrickson', () => {
  const aprilHatches = getHatchesByMonth(4);
  const hendrickson = aprilHatches.find((h) => h.id === 'hendrickson');
  assertExists(hendrickson, 'April should include Hendrickson');
});

Deno.test('getHatchesByMonth - May includes Green Drake', () => {
  const mayHatches = getHatchesByMonth(5);
  const greenDrake = mayHatches.find((h) => h.id === 'green-drake');
  assertExists(greenDrake, 'May should include Green Drake');
});

Deno.test('getHatchesByMonth - January includes midges', () => {
  const januaryHatches = getHatchesByMonth(1);
  const midge = januaryHatches.find((h) => h.id === 'midge');
  assertExists(midge, 'January should include Midge (year-round)');
});

Deno.test('getHatchesByMonth - October includes fall hatches', () => {
  const octoberHatches = getHatchesByMonth(10);
  assertEquals(octoberHatches.length > 0, true, 'October should have hatches');
  const bwo = octoberHatches.find((h) => h.id === 'bwo');
  assertExists(bwo, 'October should include BWO');
});

Deno.test('getHatchesByMonth - returns only hatches with that month in peakMonths', () => {
  const june = getHatchesByMonth(6);
  for (const hatch of june) {
    assertEquals(
      hatch.peakMonths.includes(6),
      true,
      `Hatch ${hatch.id} should have June in peakMonths`,
    );
  }
});

// ============================================================================
// getHatchesByTemp Tests
// ============================================================================

Deno.test('getHatchesByTemp - 54°F includes Hendrickson', () => {
  const hatches = getHatchesByTemp(54);
  const hendrickson = hatches.find((h) => h.id === 'hendrickson');
  assertExists(hendrickson, '54°F should include Hendrickson (50-58°F range)');
});

Deno.test('getHatchesByTemp - 50°F includes BWO', () => {
  const hatches = getHatchesByTemp(50);
  const bwo = hatches.find((h) => h.id === 'bwo');
  assertExists(bwo, '50°F should include BWO (46-56°F range)');
});

Deno.test('getHatchesByTemp - 35°F includes only midge', () => {
  const hatches = getHatchesByTemp(35);
  assertEquals(hatches.length, 1, '35°F should only include midge');
  assertEquals(hatches[0]?.id, 'midge', 'Only hatch at 35°F should be midge');
});

Deno.test('getHatchesByTemp - 32°F has no hatches (below midge min)', () => {
  const hatches = getHatchesByTemp(32);
  assertEquals(hatches.length, 0, '32°F should have no hatches');
});

Deno.test('getHatchesByTemp - returns only hatches within temp range', () => {
  const temp = 55;
  const hatches = getHatchesByTemp(temp);
  for (const hatch of hatches) {
    assertEquals(
      temp >= hatch.minTempF && temp <= hatch.maxTempF,
      true,
      `Hatch ${hatch.id} should include ${temp}°F in its range`,
    );
  }
});

// ============================================================================
// getHatchesByOrder Tests
// ============================================================================

Deno.test('getHatchesByOrder - returns mayflies', () => {
  const mayflies = getHatchesByOrder('mayfly');
  assertEquals(mayflies.length > 0, true, 'Should have mayflies');
  assertEquals(
    mayflies.every((h) => h.order === 'mayfly'),
    true,
    'All should be mayflies',
  );
});

Deno.test('getHatchesByOrder - returns caddisflies', () => {
  const caddis = getHatchesByOrder('caddisfly');
  assertEquals(caddis.length > 0, true, 'Should have caddisflies');
  assertEquals(
    caddis.every((h) => h.order === 'caddisfly'),
    true,
    'All should be caddisflies',
  );
});

Deno.test('getHatchesByOrder - returns stoneflies', () => {
  const stones = getHatchesByOrder('stonefly');
  assertEquals(stones.length > 0, true, 'Should have stoneflies');
  assertEquals(
    stones.every((h) => h.order === 'stonefly'),
    true,
    'All should be stoneflies',
  );
});

Deno.test('getHatchesByOrder - returns midges', () => {
  const midges = getHatchesByOrder('midge');
  assertEquals(midges.length > 0, true, 'Should have midges');
  assertEquals(
    midges.every((h) => h.order === 'midge'),
    true,
    'All should be midges',
  );
});

Deno.test('getHatchesByOrder - mayflies + caddis + stones + midges equals total', () => {
  const mayflies = getHatchesByOrder('mayfly');
  const caddis = getHatchesByOrder('caddisfly');
  const stones = getHatchesByOrder('stonefly');
  const midges = getHatchesByOrder('midge');

  const total = mayflies.length + caddis.length + stones.length + midges.length;
  assertEquals(total, HATCHES.length, 'Sum of all orders should equal total hatches');
});

// ============================================================================
// filterHatchesByQuery Tests
// ============================================================================

Deno.test('filterHatchesByQuery - no params returns all hatches', () => {
  const result = filterHatchesByQuery({});
  assertEquals(result.hatches.length, HATCHES.length);
  assertEquals(result.order, null);
  assertEquals(result.month, null);
});

Deno.test('filterHatchesByQuery - null params returns all hatches', () => {
  const result = filterHatchesByQuery({ order: null, month: null });
  assertEquals(result.hatches.length, HATCHES.length);
});

Deno.test('filterHatchesByQuery - empty string params returns all hatches', () => {
  const result = filterHatchesByQuery({ order: '', month: '' });
  assertEquals(result.hatches.length, HATCHES.length);
});

Deno.test('filterHatchesByQuery - valid order filters correctly', () => {
  const result = filterHatchesByQuery({ order: 'mayfly' });
  assertEquals(result.hatches.length, 9);
  assertEquals(result.order, 'mayfly');
  assertEquals(result.month, null);
  assertEquals(result.hatches.every((h) => h.order === 'mayfly'), true);
});

Deno.test('filterHatchesByQuery - valid month filters correctly', () => {
  const result = filterHatchesByQuery({ month: '5' });
  assertEquals(result.hatches.length, 12);
  assertEquals(result.month, 5);
  assertEquals(result.order, null);
  assertEquals(result.hatches.every((h) => h.peakMonths.includes(5)), true);
});

Deno.test('filterHatchesByQuery - both order and month applies AND filter', () => {
  const result = filterHatchesByQuery({ order: 'mayfly', month: '5' });
  assertEquals(result.hatches.length, 6);
  assertEquals(result.order, 'mayfly');
  assertEquals(result.month, 5);
  assertEquals(result.hatches.every((h) => h.order === 'mayfly' && h.peakMonths.includes(5)), true);
});

Deno.test('filterHatchesByQuery - invalid order returns all hatches', () => {
  const result = filterHatchesByQuery({ order: 'dragonfly' });
  assertEquals(result.hatches.length, HATCHES.length);
  assertEquals(result.order, null);
});

Deno.test('filterHatchesByQuery - non-numeric month returns all hatches', () => {
  const result = filterHatchesByQuery({ month: 'abc' });
  assertEquals(result.hatches.length, HATCHES.length);
  assertEquals(result.month, null);
});

Deno.test('filterHatchesByQuery - month out of range (13) returns all hatches', () => {
  const result = filterHatchesByQuery({ month: '13' });
  assertEquals(result.hatches.length, HATCHES.length);
  assertEquals(result.month, null);
});

Deno.test('filterHatchesByQuery - month out of range (0) returns all hatches', () => {
  const result = filterHatchesByQuery({ month: '0' });
  assertEquals(result.hatches.length, HATCHES.length);
  assertEquals(result.month, null);
});

Deno.test('filterHatchesByQuery - negative month returns all hatches', () => {
  const result = filterHatchesByQuery({ month: '-1' });
  assertEquals(result.hatches.length, HATCHES.length);
  assertEquals(result.month, null);
});
