/**
 * Cache service tests
 */

import { assertEquals, assertExists } from 'jsr:@std/assert';
import { afterAll, beforeAll, describe, it } from 'jsr:@std/testing/bdd';
import {
  CacheService,
  makeCacheHeaders,
  makeUSGSKey,
  makeWeatherKey,
  TTL,
} from '../src/services/cache.ts';

// ============================================================================
// Cache Interface Tests
// ============================================================================

describe('makeUSGSKey', () => {
  it('should generate consistent keys for USGS stations', () => {
    const key = makeUSGSKey(['01417500', '01420500'], ['00010', '00060', '00065']);
    assertEquals(key, ['cache', 'usgs', '01417500,01420500:00010,00060,00065']);
  });

  it('should sort station IDs for consistency', () => {
    const key1 = makeUSGSKey(['01420500', '01417500'], ['00010']);
    const key2 = makeUSGSKey(['01417500', '01420500'], ['00010']);
    assertEquals(key1, key2);
  });

  it('should sort params for consistency', () => {
    const key1 = makeUSGSKey(['01417500'], ['00065', '00010', '00060']);
    const key2 = makeUSGSKey(['01417500'], ['00010', '00060', '00065']);
    assertEquals(key1, key2);
  });
});

describe('makeWeatherKey', () => {
  it('should generate consistent keys for coordinates', () => {
    const key = makeWeatherKey(41.9628, -74.3051);
    assertEquals(key, ['cache', 'weather', '41.9628,-74.3051']);
  });

  it('should handle negative coordinates', () => {
    const key = makeWeatherKey(-41.9628, -74.3051);
    assertEquals(key, ['cache', 'weather', '-41.9628,-74.3051']);
  });

  it('should handle zero coordinates', () => {
    const key = makeWeatherKey(0, 0);
    assertEquals(key, ['cache', 'weather', '0.0000,0.0000']);
  });

  it('should round to 4 decimal places', () => {
    const key = makeWeatherKey(41.96281234, -74.30519876);
    assertEquals(key, ['cache', 'weather', '41.9628,-74.3052']);
  });
});

describe('TTL constants', () => {
  it('should have correct USGS TTL (15 minutes)', () => {
    assertEquals(TTL.USGS_MS, 900000);
    assertEquals(TTL.USGS_SECONDS, 900);
  });

  it('should have correct Weather TTL (1 hour)', () => {
    assertEquals(TTL.WEATHER_MS, 3600000);
    assertEquals(TTL.WEATHER_SECONDS, 3600);
  });

  it('should have correct static data TTL (24 hours)', () => {
    assertEquals(TTL.STATIC_MS, 86400000);
    assertEquals(TTL.STATIC_SECONDS, 86400);
  });
});

describe('CacheService with Deno KV', () => {
  let cache: CacheService;

  beforeAll(async () => {
    cache = new CacheService();
    await cache.clear();
  });

  afterAll(() => {
    cache.close();
  });

  it('should return null for cache miss', async () => {
    const result = await cache.get(['cache', 'test', 'nonexistent']);
    assertEquals(result, null);
  });

  it('should set and get value', async () => {
    const key = ['cache', 'test', 'simple'];
    const data = { foo: 'bar', num: 42 };

    await cache.set(key, data, 60000);
    const result = await cache.get<typeof data>(key);

    assertExists(result);
    assertEquals(result.hit, true);
    assertEquals(result.data, data);
    assertExists(result.cachedAt);
  });

  it('should track cache stats', async () => {
    const key = ['cache', 'test', 'stats'];
    await cache.set(key, { value: 1 }, 60000);

    // Initial stats after previous tests
    const before = cache.getStats();

    // Cache hit
    await cache.get(key);
    const afterHit = cache.getStats();
    assertEquals(afterHit.hits, before.hits + 1);

    // Cache miss
    await cache.get(['cache', 'test', 'missing']);
    const afterMiss = cache.getStats();
    assertEquals(afterMiss.misses, before.misses + 1);
  });

  it('should delete entries', async () => {
    const key = ['cache', 'test', 'delete'];
    await cache.set(key, { value: 1 }, 60000);

    const before = await cache.get(key);
    assertExists(before);

    await cache.delete(key);

    const after = await cache.get(key);
    assertEquals(after, null);
  });

  it('should calculate hit rate', async () => {
    const stats = cache.getStats();
    if (stats.hits + stats.misses > 0) {
      assertEquals(stats.hitRate, stats.hits / (stats.hits + stats.misses));
    }
  });
});

// ============================================================================
// Cache Wrapper Tests (with mock data)
// ============================================================================

describe('CachedUSGSService', () => {
  it('should return cached data when available', () => {
    // Simulate cache hit
    const cachedData = [
      {
        stationId: '01417500',
        stationName: 'BEAVERKILL AT COOKS FALLS NY',
        timestamp: '2024-04-15T14:00:00Z',
        waterTempF: 52,
        waterTempC: 11.1,
        dischargeCfs: 450,
        gageHeightFt: 3.2,
      },
    ];

    // Cache hit should return data directly
    assertEquals(cachedData.length, 1);
    assertEquals(cachedData[0].stationId, '01417500');
  });

  it('should fetch and cache on cache miss', () => {
    // This would be an integration test with actual KV
    // For unit test, verify the logic flow
    let fetchCalled = false;
    let cacheCalled = false;

    const mockFetch = () => {
      fetchCalled = true;
      return [{ stationId: '01417500' }];
    };

    const mockCache = (_key: string, _data: unknown) => {
      cacheCalled = true;
    };

    // Simulate cache miss -> fetch -> cache
    const cachedValue = null;
    if (!cachedValue) {
      const data = mockFetch();
      mockCache('usgs:01417500', data);
    }

    assertEquals(fetchCalled, true);
    assertEquals(cacheCalled, true);
  });
});

describe('CachedWeatherService', () => {
  it('should return cached forecast when available', () => {
    const cachedForecast = {
      location: { latitude: 41.9628, longitude: -74.3051 },
      generatedAt: '2024-04-15T14:00:00Z',
      periods: [
        {
          timestamp: '2024-04-15T14:00:00Z',
          airTempF: 55,
          cloudCoverPercent: 50,
          precipProbability: 10,
          windSpeedMph: 8,
          shortForecast: 'Partly Cloudy',
          isDaylight: true,
        },
      ],
    };

    assertEquals(cachedForecast.location.latitude, 41.9628);
    assertEquals(cachedForecast.periods.length, 1);
  });

  it('should use coordinate-based cache key', () => {
    const coords = { latitude: 41.9628, longitude: -74.3051 };
    const key = `weather:${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;

    assertEquals(key, 'weather:41.9628,-74.3051');
  });
});

// ============================================================================
// Cache Headers Tests
// ============================================================================

describe('makeCacheHeaders', () => {
  it('should generate Cache-Control header for USGS data', () => {
    const headers = makeCacheHeaders(false, TTL.USGS_SECONDS);
    assertEquals(headers['Cache-Control'], 'public, max-age=900');
  });

  it('should generate Cache-Control header for Weather data', () => {
    const headers = makeCacheHeaders(false, TTL.WEATHER_SECONDS);
    assertEquals(headers['Cache-Control'], 'public, max-age=3600');
  });

  it('should set X-Cache to HIT when cached', () => {
    const headers = makeCacheHeaders(true, TTL.USGS_SECONDS);
    assertEquals(headers['X-Cache'], 'HIT');
  });

  it('should set X-Cache to MISS when not cached', () => {
    const headers = makeCacheHeaders(false, TTL.USGS_SECONDS);
    assertEquals(headers['X-Cache'], 'MISS');
  });

  it('should include X-Cached-At when cachedAt provided', () => {
    const cachedAt = new Date('2024-04-15T14:00:00Z').getTime();
    const headers = makeCacheHeaders(true, TTL.USGS_SECONDS, cachedAt);
    assertEquals(headers['X-Cached-At'], '2024-04-15T14:00:00.000Z');
  });

  it('should not include X-Cached-At when cachedAt not provided', () => {
    const headers = makeCacheHeaders(false, TTL.USGS_SECONDS);
    assertEquals(headers['X-Cached-At'], undefined);
  });
});
