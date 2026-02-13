/**
 * Stream data tests
 */

import { assertEquals, assertExists } from '@std/assert';
import {
  filterStreamsByQuery,
  getAllStationIds,
  getStreamById,
  getStreamsByRegion,
  getStreamsByState,
  STREAMS,
} from '../src/data/streams.ts';

// ============================================================================
// STREAMS Data Tests
// ============================================================================

Deno.test('STREAMS - contains expected number of streams', () => {
  // Should have at least 10 streams
  assertEquals(STREAMS.length >= 10, true, 'Should have at least 10 streams');
});

Deno.test('STREAMS - all streams have required fields', () => {
  for (const stream of STREAMS) {
    assertExists(stream.id, `Stream missing id`);
    assertExists(stream.name, `Stream ${stream.id} missing name`);
    assertExists(stream.region, `Stream ${stream.id} missing region`);
    assertExists(stream.state, `Stream ${stream.id} missing state`);
    assertEquals(stream.stationIds.length > 0, true, `Stream ${stream.id} missing station IDs`);
  }
});

Deno.test('STREAMS - all stream IDs are unique', () => {
  const ids = STREAMS.map((s) => s.id);
  const uniqueIds = new Set(ids);
  assertEquals(ids.length, uniqueIds.size, 'Stream IDs should be unique');
});

Deno.test('STREAMS - contains iconic Catskills streams', () => {
  const streamNames = STREAMS.map((s) => s.name.toLowerCase());

  assertEquals(
    streamNames.some((n) => n.includes('beaverkill')),
    true,
    'Should include Beaverkill',
  );
  assertEquals(
    streamNames.some((n) => n.includes('willowemoc')),
    true,
    'Should include Willowemoc',
  );
  assertEquals(streamNames.some((n) => n.includes('esopus')), true, 'Should include Esopus');
});

// ============================================================================
// getStreamsByRegion Tests
// ============================================================================

Deno.test('getStreamsByRegion - returns catskills streams', () => {
  const catskills = getStreamsByRegion('catskills');
  assertEquals(catskills.length > 0, true, 'Should have Catskills streams');
  assertEquals(
    catskills.every((s) => s.region === 'catskills'),
    true,
    'All should be in Catskills',
  );
});

Deno.test('getStreamsByRegion - returns delaware streams', () => {
  const delaware = getStreamsByRegion('delaware');
  assertEquals(delaware.length > 0, true, 'Should have Delaware streams');
  assertEquals(
    delaware.every((s) => s.region === 'delaware'),
    true,
    'All should be in Delaware',
  );
});

Deno.test('getStreamsByRegion - returns croton streams', () => {
  const croton = getStreamsByRegion('croton');
  assertEquals(croton.length > 0, true, 'Should have Croton streams');
  assertEquals(
    croton.every((s) => s.region === 'croton'),
    true,
    'All should be in Croton',
  );
});

Deno.test('getStreamsByRegion - returns raritan streams', () => {
  const raritan = getStreamsByRegion('raritan');
  assertEquals(raritan.length > 0, true, 'Should have Raritan streams');
  assertEquals(
    raritan.every((s) => s.region === 'raritan'),
    true,
    'All should be in Raritan',
  );
});

// ============================================================================
// getStreamsByState Tests
// ============================================================================

Deno.test('getStreamsByState - returns NY streams', () => {
  const nyStreams = getStreamsByState('NY');
  assertEquals(nyStreams.length > 0, true, 'Should have NY streams');
  assertEquals(
    nyStreams.every((s) => s.state === 'NY'),
    true,
    'All should be in NY',
  );
});

Deno.test('getStreamsByState - returns NJ streams', () => {
  const njStreams = getStreamsByState('NJ');
  assertEquals(njStreams.length > 0, true, 'Should have NJ streams');
  assertEquals(
    njStreams.every((s) => s.state === 'NJ'),
    true,
    'All should be in NJ',
  );
});

Deno.test('getStreamsByState - all states equal total', () => {
  const ny = getStreamsByState('NY');
  const ct = getStreamsByState('CT');
  const nc = getStreamsByState('NC');
  const nj = getStreamsByState('NJ');
  assertEquals(
    ny.length + nj.length + ct.length + nc.length,
    STREAMS.length,
    'All states should equal total streams',
  );
});

// ============================================================================
// getStreamById Tests
// ============================================================================

Deno.test('getStreamById - finds beaverkill', () => {
  const stream = getStreamById('beaverkill');
  assertExists(stream);
  assertEquals(stream.name, 'Beaverkill');
  assertEquals(stream.region, 'catskills');
});

Deno.test('getStreamById - finds esopus', () => {
  const stream = getStreamById('esopus');
  assertExists(stream);
  assertEquals(stream.name, 'Esopus Creek');
});

Deno.test('getStreamById - returns undefined for unknown id', () => {
  const stream = getStreamById('nonexistent-stream');
  assertEquals(stream, undefined);
});

// ============================================================================
// getAllStationIds Tests
// ============================================================================

Deno.test('getAllStationIds - returns array of station IDs', () => {
  const stationIds = getAllStationIds();
  assertEquals(stationIds.length > 0, true, 'Should have station IDs');
  assertEquals(
    stationIds.every((id) => typeof id === 'string'),
    true,
    'All IDs should be strings',
  );
});

Deno.test('getAllStationIds - returns unique IDs', () => {
  const stationIds = getAllStationIds();
  const uniqueIds = new Set(stationIds);
  assertEquals(stationIds.length, uniqueIds.size, 'Station IDs should be unique');
});

Deno.test('getAllStationIds - includes known USGS stations', () => {
  const stationIds = getAllStationIds();
  // Beaverkill station
  assertEquals(stationIds.includes('01420500'), true, 'Should include Beaverkill station');
});

// ============================================================================
// filterStreamsByQuery Tests
// ============================================================================

Deno.test('filterStreamsByQuery - no params returns all streams', () => {
  const result = filterStreamsByQuery({});
  assertEquals(result.streams.length, STREAMS.length);
  assertEquals(result.region, undefined);
  assertEquals(result.state, undefined);
});

Deno.test('filterStreamsByQuery - null params returns all streams', () => {
  const result = filterStreamsByQuery({ region: null, state: null });
  assertEquals(result.streams.length, STREAMS.length);
});

Deno.test('filterStreamsByQuery - undefined params returns all streams', () => {
  const result = filterStreamsByQuery({ region: undefined, state: undefined });
  assertEquals(result.streams.length, STREAMS.length);
});

Deno.test('filterStreamsByQuery - empty string params returns all streams', () => {
  const result = filterStreamsByQuery({ region: '', state: '' });
  assertEquals(result.streams.length, STREAMS.length);
});

Deno.test('filterStreamsByQuery - valid region filters correctly', () => {
  const result = filterStreamsByQuery({ region: 'catskills' });
  assertEquals(result.streams.length, 4);
  assertEquals(result.region, 'catskills');
  assertEquals(result.state, undefined);
  assertEquals(result.streams.every((s) => s.region === 'catskills'), true);
});

Deno.test('filterStreamsByQuery - valid state filters correctly', () => {
  const result = filterStreamsByQuery({ state: 'NJ' });
  assertEquals(result.streams.length, 5);
  assertEquals(result.state, 'NJ');
  assertEquals(result.region, undefined);
  assertEquals(result.streams.every((s) => s.state === 'NJ'), true);
});

Deno.test('filterStreamsByQuery - region takes precedence over state', () => {
  const result = filterStreamsByQuery({ region: 'catskills', state: 'NJ' });
  assertEquals(result.streams.length, 4);
  assertEquals(result.region, 'catskills');
  assertEquals(result.state, undefined, 'State should not be set when region matches');
});

Deno.test('filterStreamsByQuery - invalid region falls through to valid state', () => {
  const result = filterStreamsByQuery({ region: 'invalid', state: 'CT' });
  assertEquals(result.streams.length, 4);
  assertEquals(result.state, 'CT');
  assertEquals(result.region, undefined);
});

Deno.test('filterStreamsByQuery - both invalid returns all streams', () => {
  const result = filterStreamsByQuery({ region: 'invalid', state: 'XX' });
  assertEquals(result.streams.length, STREAMS.length);
  assertEquals(result.region, undefined);
  assertEquals(result.state, undefined);
});
