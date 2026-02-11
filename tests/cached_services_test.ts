/**
 * Cached services tests
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import { CachedUSGSService } from '../src/services/cached-usgs.ts';
import { CachedWeatherService } from '../src/services/cached-weather.ts';
import { cacheService, makeUSGSKey, makeWeatherKey } from '../src/services/cache.ts';
import type { StationData } from '../src/models/types.ts';

// ============================================================================
// Mock Services for Unit Tests
// ============================================================================

class MockUSGSService {
  callCount = 0;
  mockData: StationData[] = [
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

  getInstantaneousValues(
    stationIds: string[],
    _params: string[],
  ): Promise<StationData[]> {
    this.callCount++;
    return Promise.resolve(this.mockData.filter((d) => stationIds.includes(d.stationId)));
  }
}

class MockWeatherService {
  callCount = 0;
  mockData = {
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

  getHourlyForecast(_coords: { latitude: number; longitude: number }) {
    this.callCount++;
    return Promise.resolve(this.mockData);
  }
}

// ============================================================================
// CachedUSGSService Tests
// ============================================================================

describe('CachedUSGSService', () => {
  let mockUSGS: MockUSGSService;
  let cachedService: CachedUSGSService;

  beforeAll(async () => {
    mockUSGS = new MockUSGSService();
    // @ts-ignore - Mock service has compatible interface
    cachedService = new CachedUSGSService(mockUSGS);
    await cacheService.clear();
  });

  afterAll(() => {
    cacheService.close();
  });

  it('should return empty array for empty station IDs', async () => {
    const result = await cachedService.getInstantaneousValues([]);
    assertEquals(result.data, []);
    assertEquals(result.cached, false);
  });

  it('should fetch from API on cache miss', async () => {
    const beforeCount = mockUSGS.callCount;

    const result = await cachedService.getInstantaneousValues(['01417500']);

    assertEquals(mockUSGS.callCount, beforeCount + 1);
    assertEquals(result.cached, false);
    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].stationId, '01417500');
  });

  it('should return cached data on cache hit', async () => {
    // First call should cache
    await cachedService.getInstantaneousValues(['01417500']);
    const beforeCount = mockUSGS.callCount;

    // Second call should use cache
    const result = await cachedService.getInstantaneousValues(['01417500']);

    assertEquals(mockUSGS.callCount, beforeCount); // No additional API call
    assertEquals(result.cached, true);
    assertExists(result.cachedAt);
    assertEquals(result.data[0].stationId, '01417500');
  });

  it('should invalidate cache', async () => {
    // Ensure cached
    await cachedService.getInstantaneousValues(['01417500']);

    // Invalidate
    await cachedService.invalidate(['01417500']);

    // Check cache is empty
    const key = makeUSGSKey(['01417500'], ['00010', '00060', '00065']);
    const cached = await cacheService.get(key);
    assertEquals(cached, null);
  });
});

// ============================================================================
// CachedWeatherService Tests
// ============================================================================

describe('CachedWeatherService', () => {
  let mockWeather: MockWeatherService;
  let cachedService: CachedWeatherService;

  beforeAll(async () => {
    mockWeather = new MockWeatherService();
    // @ts-ignore - Mock service has compatible interface
    cachedService = new CachedWeatherService(mockWeather);
    await cacheService.clear();
  });

  afterAll(() => {
    cacheService.close();
  });

  it('should fetch from API on cache miss', async () => {
    const coords = { latitude: 41.9628, longitude: -74.3051 };
    const beforeCount = mockWeather.callCount;

    const result = await cachedService.getHourlyForecast(coords);

    assertEquals(mockWeather.callCount, beforeCount + 1);
    assertEquals(result.cached, false);
    assertEquals(result.data.location.latitude, 41.9628);
  });

  it('should return cached data on cache hit', async () => {
    const coords = { latitude: 41.9628, longitude: -74.3051 };

    // First call should cache
    await cachedService.getHourlyForecast(coords);
    const beforeCount = mockWeather.callCount;

    // Second call should use cache
    const result = await cachedService.getHourlyForecast(coords);

    assertEquals(mockWeather.callCount, beforeCount); // No additional API call
    assertEquals(result.cached, true);
    assertExists(result.cachedAt);
  });

  it('should get current conditions from cached forecast', async () => {
    const coords = { latitude: 41.9628, longitude: -74.3051 };

    const result = await cachedService.getCurrentConditions(coords);

    assertExists(result.data);
    assertEquals(result.data?.airTempF, 55);
    assertEquals(result.data?.shortForecast, 'Partly Cloudy');
  });

  it('should invalidate cache', async () => {
    const coords = { latitude: 41.9628, longitude: -74.3051 };

    // Ensure cached
    await cachedService.getHourlyForecast(coords);

    // Invalidate
    await cachedService.invalidate(coords);

    // Check cache is empty
    const key = makeWeatherKey(coords.latitude, coords.longitude);
    const cached = await cacheService.get(key);
    assertEquals(cached, null);
  });

  it('should cache different coordinates separately', async () => {
    const coords1 = { latitude: 41.9628, longitude: -74.3051 };
    const coords2 = { latitude: 42.0000, longitude: -75.0000 };

    await cachedService.getHourlyForecast(coords1);
    const beforeCount = mockWeather.callCount;

    // Different coords should fetch
    await cachedService.getHourlyForecast(coords2);
    assertEquals(mockWeather.callCount, beforeCount + 1);
  });
});
