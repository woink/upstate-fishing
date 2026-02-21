/**
 * Fly shop data tests
 */

import { assertEquals, assertExists } from '@std/assert';
import {
  filterShopsByQuery,
  FLY_SHOPS,
  getShopById,
  getShopsByRegion,
  getShopsByState,
} from '../src/data/fly-shops.ts';
import { FlyShopSchema } from '../src/models/types.ts';

// ============================================================================
// FLY_SHOPS Data Tests
// ============================================================================

Deno.test('FLY_SHOPS - contains expected number of shops', () => {
  assertEquals(FLY_SHOPS.length >= 10, true, 'Should have at least 10 fly shops');
});

Deno.test('FLY_SHOPS - all shops have required fields', () => {
  for (const shop of FLY_SHOPS) {
    assertExists(shop.id, `Shop missing id`);
    assertExists(shop.name, `Shop ${shop.id} missing name`);
    assertExists(shop.region, `Shop ${shop.id} missing region`);
    assertExists(shop.state, `Shop ${shop.id} missing state`);
    assertExists(shop.address, `Shop ${shop.id} missing address`);
    assertExists(shop.coordinates, `Shop ${shop.id} missing coordinates`);
    assertExists(shop.phone, `Shop ${shop.id} missing phone`);
    assertExists(shop.description, `Shop ${shop.id} missing description`);
  }
});

Deno.test('FLY_SHOPS - all shops validate against FlyShopSchema', () => {
  for (const shop of FLY_SHOPS) {
    const result = FlyShopSchema.safeParse(shop);
    assertEquals(result.success, true, `Shop ${shop.id} failed schema validation`);
  }
});

Deno.test('FLY_SHOPS - all shop IDs are unique', () => {
  const ids = FLY_SHOPS.map((s) => s.id);
  const uniqueIds = new Set(ids);
  assertEquals(ids.length, uniqueIds.size, 'Shop IDs should be unique');
});

Deno.test('FLY_SHOPS - all coordinates are valid', () => {
  for (const shop of FLY_SHOPS) {
    assertEquals(
      shop.coordinates.latitude >= -90 && shop.coordinates.latitude <= 90,
      true,
      `Shop ${shop.id} has invalid latitude: ${shop.coordinates.latitude}`,
    );
    assertEquals(
      shop.coordinates.longitude >= -180 && shop.coordinates.longitude <= 180,
      true,
      `Shop ${shop.id} has invalid longitude: ${shop.coordinates.longitude}`,
    );
  }
});

Deno.test('FLY_SHOPS - covers all states', () => {
  const states = new Set(FLY_SHOPS.map((s) => s.state));
  assertEquals(states.has('NY'), true, 'Should have NY shops');
  assertEquals(states.has('NJ'), true, 'Should have NJ shops');
  assertEquals(states.has('CT'), true, 'Should have CT shops');
  assertEquals(states.has('NC'), true, 'Should have NC shops');
});

Deno.test('FLY_SHOPS - contains iconic Catskills shops', () => {
  const shopNames = FLY_SHOPS.map((s) => s.name.toLowerCase());
  assertEquals(
    shopNames.some((n) => n.includes('beaverkill')),
    true,
    'Should include Beaverkill Angler',
  );
});

// ============================================================================
// getShopsByRegion Tests
// ============================================================================

Deno.test('getShopsByRegion - returns catskills shops', () => {
  const shops = getShopsByRegion('catskills');
  assertEquals(shops.length > 0, true, 'Should have Catskills shops');
  assertEquals(
    shops.every((s) => s.region === 'catskills'),
    true,
    'All should be in Catskills',
  );
});

Deno.test('getShopsByRegion - returns connecticut shops', () => {
  const shops = getShopsByRegion('connecticut');
  assertEquals(shops.length > 0, true, 'Should have Connecticut shops');
  assertEquals(
    shops.every((s) => s.region === 'connecticut'),
    true,
    'All should be in Connecticut',
  );
});

Deno.test('getShopsByRegion - returns raritan shops', () => {
  const shops = getShopsByRegion('raritan');
  assertEquals(shops.length > 0, true, 'Should have Raritan shops');
  assertEquals(
    shops.every((s) => s.region === 'raritan'),
    true,
    'All should be in Raritan',
  );
});

// ============================================================================
// getShopsByState Tests
// ============================================================================

Deno.test('getShopsByState - returns NY shops', () => {
  const shops = getShopsByState('NY');
  assertEquals(shops.length > 0, true, 'Should have NY shops');
  assertEquals(
    shops.every((s) => s.state === 'NY'),
    true,
    'All should be in NY',
  );
});

Deno.test('getShopsByState - returns NJ shops', () => {
  const shops = getShopsByState('NJ');
  assertEquals(shops.length > 0, true, 'Should have NJ shops');
  assertEquals(
    shops.every((s) => s.state === 'NJ'),
    true,
    'All should be in NJ',
  );
});

Deno.test('getShopsByState - all states equal total', () => {
  const ny = getShopsByState('NY');
  const nj = getShopsByState('NJ');
  const ct = getShopsByState('CT');
  const nc = getShopsByState('NC');
  assertEquals(
    ny.length + nj.length + ct.length + nc.length,
    FLY_SHOPS.length,
    'All states should equal total shops',
  );
});

// ============================================================================
// getShopById Tests
// ============================================================================

Deno.test('getShopById - finds beaverkill-angler', () => {
  const shop = getShopById('beaverkill-angler');
  assertExists(shop);
  assertEquals(shop.name, 'Beaverkill Angler');
  assertEquals(shop.region, 'catskills');
});

Deno.test('getShopById - returns undefined for unknown id', () => {
  const shop = getShopById('nonexistent-shop');
  assertEquals(shop, undefined);
});

// ============================================================================
// filterShopsByQuery Tests
// ============================================================================

Deno.test('filterShopsByQuery - no params returns all shops', () => {
  const result = filterShopsByQuery({});
  assertEquals(result.shops.length, FLY_SHOPS.length);
  assertEquals(result.region, undefined);
  assertEquals(result.state, undefined);
});

Deno.test('filterShopsByQuery - null params returns all shops', () => {
  const result = filterShopsByQuery({ region: null, state: null });
  assertEquals(result.shops.length, FLY_SHOPS.length);
});

Deno.test('filterShopsByQuery - valid region filters correctly', () => {
  const result = filterShopsByQuery({ region: 'catskills' });
  assertEquals(result.shops.length > 0, true);
  assertEquals(result.region, 'catskills');
  assertEquals(result.state, undefined);
  assertEquals(result.shops.every((s) => s.region === 'catskills'), true);
});

Deno.test('filterShopsByQuery - valid state filters correctly', () => {
  const result = filterShopsByQuery({ state: 'NJ' });
  assertEquals(result.shops.length > 0, true);
  assertEquals(result.state, 'NJ');
  assertEquals(result.region, undefined);
  assertEquals(result.shops.every((s) => s.state === 'NJ'), true);
});

Deno.test('filterShopsByQuery - region takes precedence over state', () => {
  const result = filterShopsByQuery({ region: 'catskills', state: 'NJ' });
  assertEquals(result.region, 'catskills');
  assertEquals(result.state, undefined);
});

Deno.test('filterShopsByQuery - invalid region falls through to valid state', () => {
  const result = filterShopsByQuery({ region: 'invalid', state: 'CT' });
  assertEquals(result.state, 'CT');
  assertEquals(result.region, undefined);
});

Deno.test('filterShopsByQuery - both invalid returns all shops', () => {
  const result = filterShopsByQuery({ region: 'invalid', state: 'XX' });
  assertEquals(result.shops.length, FLY_SHOPS.length);
  assertEquals(result.region, undefined);
  assertEquals(result.state, undefined);
});
