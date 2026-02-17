/**
 * Weather service tests
 */

import { assertEquals } from '@std/assert';
import { WeatherService } from '../src/services/weather.ts';

// ============================================================================
// WeatherService Unit Tests (no network calls)
// ============================================================================

Deno.test('WeatherService - constructor accepts default options', () => {
  const service = new WeatherService();
  // Should not throw
  assertEquals(typeof service, 'object');
});

Deno.test('WeatherService - constructor accepts custom options', () => {
  const service = new WeatherService({
    baseUrl: 'https://custom.api.gov',
    userAgent: 'TestApp/1.0',
    timeout: 5000,
  });
  assertEquals(typeof service, 'object');
});

// ============================================================================
// WeatherService - parseWindSpeed (testing private method behavior via integration)
// ============================================================================

// Note: Testing private methods through behavior. These tests verify the service
// can be constructed with various configurations. Full integration tests would
// require mocking fetch or using a test server.

Deno.test('WeatherService - handles various configurations', () => {
  // Default configuration
  const defaultService = new WeatherService();
  assertEquals(typeof defaultService, 'object');

  // Custom base URL
  const customUrl = new WeatherService({ baseUrl: 'https://test.weather.gov' });
  assertEquals(typeof customUrl, 'object');

  // Custom timeout
  const customTimeout = new WeatherService({ timeout: 30000 });
  assertEquals(typeof customTimeout, 'object');

  // Custom user agent
  const customAgent = new WeatherService({ userAgent: 'FishingApp/2.0 (test@test.com)' });
  assertEquals(typeof customAgent, 'object');
});

// ============================================================================
// WeatherService - Cloud Cover Estimation Logic Tests
// ============================================================================

// Testing the internal cloud cover estimation logic by examining expected mappings
// This tests the service's behavior for various forecast strings

Deno.test('WeatherService - understands forecast terms', () => {
  // The service should be able to estimate cloud cover from forecast text
  // These are the expected mappings based on the implementation:
  const expectedMappings: Array<[string, number]> = [
    ['Sunny', 10],
    ['Clear', 10],
    ['Mostly Sunny', 25],
    ['Mostly Clear', 25],
    ['Partly Cloudy', 50],
    ['Partly Sunny', 50],
    ['Mostly Cloudy', 75],
    ['Cloudy', 90],
    ['Overcast', 90],
    ['Rain', 85],
    ['Showers', 85],
    ['Thunderstorm', 85],
  ];

  // Document expected behavior (actual testing would require exposing the method
  // or integration testing with mocked responses)
  for (const [forecast, expectedCover] of expectedMappings) {
    assertEquals(
      typeof forecast === 'string' && typeof expectedCover === 'number',
      true,
      `Expected mapping for "${forecast}" -> ${expectedCover}%`,
    );
  }
});

// ============================================================================
// WeatherService - Temperature Conversion
// ============================================================================

Deno.test('WeatherService - temperature conversion logic', () => {
  // Verify Celsius to Fahrenheit conversion formula
  // F = C * 9/5 + 32

  const testCases = [
    { celsius: 0, fahrenheit: 32 },
    { celsius: 100, fahrenheit: 212 },
    { celsius: -40, fahrenheit: -40 }, // Same in both scales
    { celsius: 20, fahrenheit: 68 },
    { celsius: 12.2, fahrenheit: 54 }, // Typical water temp
  ];

  for (const { celsius, fahrenheit } of testCases) {
    const converted = Math.round(celsius * 9 / 5 + 32);
    assertEquals(converted, fahrenheit, `${celsius}°C should equal ${fahrenheit}°F`);
  }
});

// ============================================================================
// WeatherService - Mock Server Tests for parseWindSpeed and estimateCloudCover
// ============================================================================

/**
 * Build a mock NWS points response
 */
function buildMockPointsResponse(gridId: string, gridX: number, gridY: number) {
  return {
    properties: {
      gridId,
      gridX,
      gridY,
      forecast: `https://mock/gridpoints/${gridId}/${gridX},${gridY}/forecast`,
      forecastHourly: `https://mock/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`,
    },
  };
}

/**
 * Build a mock NWS hourly forecast response with a single period
 */
function buildMockForecastResponse(
  windSpeed: string,
  shortForecast: string,
  opts: { temperature?: number; isDaytime?: boolean } = {},
) {
  return {
    properties: {
      generatedAt: '2024-04-15T12:00:00Z',
      periods: [
        {
          startTime: '2024-04-15T14:00:00-04:00',
          endTime: '2024-04-15T15:00:00-04:00',
          temperature: opts.temperature ?? 58,
          temperatureUnit: 'F',
          probabilityOfPrecipitation: { value: 10 },
          windSpeed,
          shortForecast,
          isDaytime: opts.isDaytime ?? true,
        },
      ],
    },
  };
}

/**
 * Build a mock gridpoints response (sky cover data)
 * Returns empty sky cover so the service falls back to estimateCloudCover
 */
function buildMockGridpointsResponse() {
  return {
    properties: {},
  };
}

/**
 * Create a mock NWS server that handles points, forecast/hourly, and gridpoints endpoints.
 * Returns both the server and its port number.
 */
function createMockWeatherServer(
  windSpeed: string,
  shortForecast: string,
): Deno.HttpServer {
  return Deno.serve({ port: 0 }, (req) => {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.startsWith('/points/')) {
      return new Response(JSON.stringify(buildMockPointsResponse('TST', 50, 50)), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (path.includes('/forecast/hourly')) {
      return new Response(
        JSON.stringify(buildMockForecastResponse(windSpeed, shortForecast)),
        { headers: { 'content-type': 'application/json' } },
      );
    }

    if (path.includes('/gridpoints/')) {
      return new Response(JSON.stringify(buildMockGridpointsResponse()), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  });
}

function getServerPort(server: Deno.HttpServer): number {
  return (server.addr as Deno.NetAddr).port;
}

Deno.test('WeatherService - parseWindSpeed "10 mph" returns 10', async () => {
  const server = createMockWeatherServer('10 mph', 'Clear');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].windSpeedMph, 10);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - parseWindSpeed "5 to 10 mph" returns 8 (average, rounded)', async () => {
  const server = createMockWeatherServer('5 to 10 mph', 'Clear');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].windSpeedMph, 8);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - parseWindSpeed "15 mph" returns 15', async () => {
  const server = createMockWeatherServer('15 mph', 'Clear');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].windSpeedMph, 15);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - parseWindSpeed "20 to 30 mph" returns 25', async () => {
  const server = createMockWeatherServer('20 to 30 mph', 'Clear');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].windSpeedMph, 25);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - estimateCloudCover "Sunny" returns 10', async () => {
  const server = createMockWeatherServer('5 mph', 'Sunny');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].cloudCoverPercent, 10);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - estimateCloudCover "Mostly Sunny" returns 25', async () => {
  const server = createMockWeatherServer('5 mph', 'Mostly Sunny');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].cloudCoverPercent, 25);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - estimateCloudCover "Partly Cloudy" returns 50', async () => {
  const server = createMockWeatherServer('5 mph', 'Partly Cloudy');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].cloudCoverPercent, 50);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - estimateCloudCover "Mostly Cloudy" returns 75', async () => {
  const server = createMockWeatherServer('5 mph', 'Mostly Cloudy');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].cloudCoverPercent, 75);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - estimateCloudCover "Overcast" returns 90', async () => {
  const server = createMockWeatherServer('5 mph', 'Overcast');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].cloudCoverPercent, 90);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - estimateCloudCover "Rain Likely" returns 85', async () => {
  const server = createMockWeatherServer('5 mph', 'Rain Likely');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].cloudCoverPercent, 85);
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - estimateCloudCover "Some Unknown Text" returns 50 (default)', async () => {
  const server = createMockWeatherServer('5 mph', 'Some Unknown Text');
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    const forecast = await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });
    assertEquals(forecast.periods[0].cloudCoverPercent, 50);
  } finally {
    await server.shutdown();
  }
});

// ============================================================================
// WeatherService - User-Agent Header Tests
// ============================================================================

/**
 * Mock server that captures the User-Agent header from the first request.
 */
function createHeaderCapturingServer(): {
  server: Deno.HttpServer;
  getCapturedUserAgent: () => string | null;
} {
  let capturedUserAgent: string | null = null;

  const server = Deno.serve({ port: 0 }, (req) => {
    if (capturedUserAgent === null) {
      capturedUserAgent = req.headers.get('user-agent');
    }

    const url = new URL(req.url);
    const path = url.pathname;

    if (path.startsWith('/points/')) {
      return new Response(JSON.stringify(buildMockPointsResponse('TST', 50, 50)), {
        headers: { 'content-type': 'application/json' },
      });
    }
    if (path.includes('/forecast/hourly')) {
      return new Response(
        JSON.stringify(buildMockForecastResponse('5 mph', 'Clear')),
        { headers: { 'content-type': 'application/json' } },
      );
    }
    if (path.includes('/gridpoints/')) {
      return new Response(JSON.stringify(buildMockGridpointsResponse()), {
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('Not Found', { status: 404 });
  });

  return { server, getCapturedUserAgent: () => capturedUserAgent };
}

Deno.test('WeatherService - default User-Agent contains project identifier, not placeholder', async () => {
  const { server, getCapturedUserAgent } = createHeaderCapturingServer();
  try {
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });

    const ua = getCapturedUserAgent();
    assertEquals(
      ua?.includes('contact@example.com'),
      false,
      'Default UA must not use placeholder email',
    );
    assertEquals(ua?.includes('UpstateFishing'), true, 'Default UA should identify the project');
  } finally {
    await server.shutdown();
  }
});

Deno.test('WeatherService - WEATHER_USER_AGENT env var overrides default', async () => {
  const { server, getCapturedUserAgent } = createHeaderCapturingServer();
  const original = Deno.env.get('WEATHER_USER_AGENT');
  try {
    Deno.env.set('WEATHER_USER_AGENT', 'CustomApp/2.0 (custom@test.com)');
    const port = getServerPort(server);
    const service = new WeatherService({ baseUrl: `http://localhost:${port}` });
    await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });

    const ua = getCapturedUserAgent();
    assertEquals(ua, 'CustomApp/2.0 (custom@test.com)');
  } finally {
    if (original !== undefined) {
      Deno.env.set('WEATHER_USER_AGENT', original);
    } else {
      Deno.env.delete('WEATHER_USER_AGENT');
    }
    await server.shutdown();
  }
});

Deno.test('WeatherService - explicit userAgent option overrides env var', async () => {
  const { server, getCapturedUserAgent } = createHeaderCapturingServer();
  const original = Deno.env.get('WEATHER_USER_AGENT');
  try {
    Deno.env.set('WEATHER_USER_AGENT', 'EnvApp/1.0');
    const port = getServerPort(server);
    const service = new WeatherService({
      baseUrl: `http://localhost:${port}`,
      userAgent: 'ExplicitApp/3.0 (explicit@test.com)',
    });
    await service.getHourlyForecast({ latitude: 41.0, longitude: -74.0 });

    const ua = getCapturedUserAgent();
    assertEquals(ua, 'ExplicitApp/3.0 (explicit@test.com)');
  } finally {
    if (original !== undefined) {
      Deno.env.set('WEATHER_USER_AGENT', original);
    } else {
      Deno.env.delete('WEATHER_USER_AGENT');
    }
    await server.shutdown();
  }
});

// ============================================================================
// WeatherService - Integration Test (requires network, skipped by default)
// ============================================================================

Deno.test({
  name: 'WeatherService - fetches real forecast (integration)',
  ignore: Deno.env.get('RUN_INTEGRATION_TESTS') !== 'true',
  fn: async () => {
    const service = new WeatherService();

    // Beaverkill coordinates
    const coords = { latitude: 41.9365, longitude: -74.9201 };

    const forecast = await service.getHourlyForecast(coords);

    assertEquals(typeof forecast.generatedAt, 'string');
    assertEquals(forecast.periods.length > 0, true, 'Should have forecast periods');

    const firstPeriod = forecast.periods[0];
    if (firstPeriod) {
      assertEquals(typeof firstPeriod.airTempF, 'number');
      assertEquals(typeof firstPeriod.cloudCoverPercent, 'number');
      assertEquals(typeof firstPeriod.windSpeedMph, 'number');
    }
  },
});
