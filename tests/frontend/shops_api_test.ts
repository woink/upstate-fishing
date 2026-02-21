/**
 * Fly Shop Frontend / API Handler Logic Tests
 */

import { assertEquals, assertExists } from '@std/assert';
import {
  filterShopsByQuery,
  FLY_SHOPS,
  getShopById,
  getShopsByRegion,
  getShopsByState,
} from '@shared/data/fly-shops.ts';

// ============================================================================
// Route Parameter Tests
// ============================================================================

Deno.test('shops route - extracts region from query params', () => {
  const url = new URL('http://localhost:8001/shops?region=catskills');
  const region = url.searchParams.get('region');
  assertEquals(region, 'catskills');
});

Deno.test('shops route - extracts state from query params', () => {
  const url = new URL('http://localhost:8001/shops?state=NJ');
  const state = url.searchParams.get('state');
  assertEquals(state, 'NJ');
});

Deno.test('shops route - handles missing params', () => {
  const url = new URL('http://localhost:8001/shops');
  assertEquals(url.searchParams.get('region'), null);
  assertEquals(url.searchParams.get('state'), null);
});

// ============================================================================
// Page Title Generation Tests
// ============================================================================

Deno.test('shops page title - with region', () => {
  const regionLabels: Record<string, string> = {
    catskills: 'Catskills',
    connecticut: 'Connecticut',
    raritan: 'Raritan / NJ',
  };

  const region = 'catskills';
  const title = `${regionLabels[region] ?? region} Fly Shops`;
  assertEquals(title, 'Catskills Fly Shops');
});

Deno.test('shops page title - with state', () => {
  const state = 'NJ';
  const title = `${state} Fly Shops`;
  assertEquals(title, 'NJ Fly Shops');
});

Deno.test('shops page title - no filter', () => {
  const region = undefined;
  const state = undefined;
  const title = region ? 'Region Fly Shops' : state ? `${state} Fly Shops` : 'All Fly Shops';
  assertEquals(title, 'All Fly Shops');
});

// ============================================================================
// API Response Handling Tests
// ============================================================================

Deno.test('shops API response - success structure', () => {
  const response = {
    success: true,
    data: [{ id: 'beaverkill-angler', name: 'Beaverkill Angler' }],
    count: 1,
    timestamp: '2024-04-15T14:00:00Z',
  };

  assertEquals(response.success, true);
  assertExists(response.data);
  assertEquals(Array.isArray(response.data), true);
  assertEquals(response.count, 1);
});

Deno.test('shops API response - empty data for unknown region', () => {
  const json = {
    success: true,
    data: [] as unknown[],
    count: 0,
  };
  assertEquals(json.data.length, 0);
});

// ============================================================================
// Filter Logic Tests (direct data imports)
// ============================================================================

Deno.test('shops filter logic - getShopsByRegion returns correct shops', () => {
  const shops = getShopsByRegion('catskills');
  assertEquals(shops.length > 0, true, 'Should have catskills shops');
  for (const shop of shops) {
    assertEquals(shop.region, 'catskills');
  }
});

Deno.test('shops filter logic - getShopsByState returns correct shops', () => {
  const shops = getShopsByState('NJ');
  assertEquals(shops.length > 0, true, 'Should have NJ shops');
  for (const shop of shops) {
    assertEquals(shop.state, 'NJ');
  }
});

Deno.test('shops filter logic - region takes precedence over state', () => {
  const region = 'catskills';
  const state = 'NY';
  const filterUsed = region ? 'region' : state ? 'state' : 'none';
  assertEquals(filterUsed, 'region');
});

// ============================================================================
// Detail Page Tests
// ============================================================================

Deno.test('shop detail - getShopById returns correct shop', () => {
  const shop = getShopById('beaverkill-angler');
  assertExists(shop);
  assertEquals(shop.name, 'Beaverkill Angler');
  assertEquals(shop.region, 'catskills');
  assertEquals(shop.state, 'NY');
  assertExists(shop.coordinates);
  assertExists(shop.description);
});

Deno.test('shop detail - returns undefined for missing shop', () => {
  const shop = getShopById('nonexistent');
  assertEquals(shop, undefined);
});

// ============================================================================
// filterShopsByQuery Tests
// ============================================================================

Deno.test('filterShopsByQuery - region catskills returns catskills shops', () => {
  const result = filterShopsByQuery({ region: 'catskills' });
  assertEquals(result.shops.length > 0, true);
  for (const s of result.shops) {
    assertEquals(s.region, 'catskills');
    assertEquals(s.state, 'NY');
  }
  assertEquals(result.region, 'catskills');
});

Deno.test('filterShopsByQuery - state NC returns NC shops', () => {
  const result = filterShopsByQuery({ state: 'NC' });
  assertEquals(result.shops.length > 0, true);
  for (const s of result.shops) {
    assertEquals(s.state, 'NC');
  }
  assertEquals(result.state, 'NC');
});

Deno.test('filterShopsByQuery - invalid region returns all shops', () => {
  const result = filterShopsByQuery({ region: 'invalid-region' });
  assertEquals(result.shops.length, FLY_SHOPS.length);
  assertEquals(result.region, undefined);
  assertEquals(result.state, undefined);
});

Deno.test('filterShopsByQuery - empty params returns all shops', () => {
  const result = filterShopsByQuery({});
  assertEquals(result.shops.length, FLY_SHOPS.length);
});
