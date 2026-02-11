/**
 * API Routes
 */

import { Hono } from '@hono/hono';
import { z } from 'zod';
import { getStreamById, getStreamsByRegion, getStreamsByState, STREAMS } from '../data/streams.ts';
import { HATCHES } from '../data/hatches.ts';
import { cachedUSGSService } from '../services/cached-usgs.ts';
import { cachedWeatherService } from '../services/cached-weather.ts';
import { predictionService } from '../services/predictions.ts';
import { makeCacheHeaders, TTL } from '../services/cache.ts';
import type { Region, State } from '../models/types.ts';

// ============================================================================
// API Router
// ============================================================================

export const api = new Hono();

// ============================================================================
// Stream Endpoints
// ============================================================================

/**
 * GET /api/streams
 * List all streams, optionally filtered by region or state
 */
api.get('/streams', (c) => {
  const region = c.req.query('region') as Region | undefined;
  const state = c.req.query('state') as State | undefined;

  let streams = [...STREAMS];

  if (region) {
    streams = getStreamsByRegion(region);
  } else if (state) {
    streams = getStreamsByState(state);
  }

  return c.json({
    success: true,
    data: streams,
    count: streams.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/streams/:id
 * Get a specific stream by ID
 */
api.get('/streams/:id', (c) => {
  const id = c.req.param('id');
  const stream = getStreamById(id);

  if (!stream) {
    return c.json(
      {
        success: false,
        error: { error: 'Stream not found', code: 'NOT_FOUND' },
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: stream,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/streams/:id/conditions
 * Get current conditions and hatch predictions for a stream
 */
api.get('/streams/:id/conditions', async (c) => {
  const id = c.req.param('id');
  const stream = getStreamById(id);

  if (!stream) {
    return c.json(
      {
        success: false,
        error: { error: 'Stream not found', code: 'NOT_FOUND' },
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  try {
    // Fetch USGS data (cached)
    const usgsResult = await cachedUSGSService.getInstantaneousValues(stream.stationIds);

    // Fetch weather if coordinates available (cached)
    let weather = null;
    let weatherCached = false;
    let weatherCachedAt: number | null = null;
    if (stream.coordinates) {
      try {
        const weatherResult = await cachedWeatherService.getCurrentConditions(stream.coordinates);
        weather = weatherResult.data;
        weatherCached = weatherResult.cached;
        weatherCachedAt = weatherResult.cachedAt;
      } catch (err) {
        console.warn(`Failed to fetch weather for ${stream.name}:`, err);
      }
    }

    // Generate predictions
    const conditions = predictionService.generateConditions(stream, usgsResult.data, weather);

    // Determine cache status (both must be cached for overall HIT)
    const allCached = usgsResult.cached && (stream.coordinates ? weatherCached : true);
    const earliestCachedAt = Math.min(
      usgsResult.cachedAt ?? Date.now(),
      weatherCachedAt ?? Date.now(),
    );

    // Add cache headers - use shorter TTL (USGS)
    const cacheHeaders = makeCacheHeaders(
      allCached,
      TTL.USGS_SECONDS,
      allCached ? earliestCachedAt : null,
    );

    return c.json(
      {
        success: true,
        data: conditions,
        cache: {
          usgs: usgsResult.cached ? 'HIT' : 'MISS',
          weather: stream.coordinates ? (weatherCached ? 'HIT' : 'MISS') : 'N/A',
        },
        timestamp: new Date().toISOString(),
      },
      200,
      cacheHeaders,
    );
  } catch (err) {
    console.error(`Error fetching conditions for ${stream.name}:`, err);
    return c.json(
      {
        success: false,
        error: {
          error: 'Failed to fetch conditions',
          code: 'FETCH_ERROR',
          details: err instanceof Error ? err.message : String(err),
        },
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});

// ============================================================================
// Hatch Endpoints
// ============================================================================

/**
 * GET /api/hatches
 * List all known hatches
 */
api.get('/hatches', (c) => {
  const order = c.req.query('order');
  const month = c.req.query('month');

  let hatches = [...HATCHES];

  if (order) {
    hatches = hatches.filter((h) => h.order === order);
  }

  if (month) {
    const monthNum = parseInt(month, 10);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      hatches = hatches.filter((h) => h.peakMonths.includes(monthNum));
    }
  }

  return c.json({
    success: true,
    data: hatches,
    count: hatches.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/hatches/:id
 * Get a specific hatch by ID
 */
api.get('/hatches/:id', (c) => {
  const id = c.req.param('id');
  const hatch = HATCHES.find((h) => h.id === id);

  if (!hatch) {
    return c.json(
      {
        success: false,
        error: { error: 'Hatch not found', code: 'NOT_FOUND' },
        timestamp: new Date().toISOString(),
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: hatch,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Station Endpoints
// ============================================================================

/**
 * GET /api/stations/:id
 * Get current readings for a specific USGS station
 */
api.get('/stations/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const result = await cachedUSGSService.getInstantaneousValues([id]);

    if (result.data.length === 0) {
      return c.json(
        {
          success: false,
          error: { error: 'Station not found or no data available', code: 'NOT_FOUND' },
          timestamp: new Date().toISOString(),
        },
        404,
      );
    }

    // Add cache headers
    const cacheHeaders = makeCacheHeaders(result.cached, TTL.USGS_SECONDS, result.cachedAt);

    return c.json(
      {
        success: true,
        data: result.data[0],
        cache: result.cached ? 'HIT' : 'MISS',
        timestamp: new Date().toISOString(),
      },
      200,
      cacheHeaders,
    );
  } catch (err) {
    return c.json(
      {
        success: false,
        error: {
          error: 'Failed to fetch station data',
          code: 'FETCH_ERROR',
          details: err instanceof Error ? err.message : String(err),
        },
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});

// ============================================================================
// Prediction Endpoints
// ============================================================================

const PredictRequestSchema = z.object({
  waterTempF: z.number().optional(),
  airTempF: z.number().optional(),
  cloudCoverPercent: z.number().min(0).max(100).optional(),
  precipProbability: z.number().min(0).max(100).optional(),
  date: z.string().datetime().optional(),
});

/**
 * POST /api/predict
 * Get hatch predictions for custom conditions
 */
api.post('/predict', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = PredictRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            error: 'Invalid request body',
            code: 'VALIDATION_ERROR',
            details: parsed.error.issues,
          },
          timestamp: new Date().toISOString(),
        },
        400,
      );
    }

    const { waterTempF, airTempF, cloudCoverPercent, precipProbability, date } = parsed.data;

    // Build mock station data if temp provided
    const stationData = waterTempF
      ? [{
        stationId: 'custom',
        stationName: 'Custom Input',
        timestamp: new Date().toISOString(),
        waterTempF,
        waterTempC: (waterTempF - 32) * 5 / 9,
        dischargeCfs: null,
        gageHeightFt: null,
      }]
      : [];

    // Build mock weather if provided
    const weather = airTempF
      ? {
        timestamp: new Date().toISOString(),
        airTempF,
        cloudCoverPercent: cloudCoverPercent ?? 50,
        precipProbability: precipProbability ?? 0,
        windSpeedMph: 5,
        shortForecast: 'Custom conditions',
        isDaylight: true,
      }
      : null;

    const predictions = predictionService.predictHatches(
      stationData,
      weather,
      date ? new Date(date) : new Date(),
    );

    return c.json({
      success: true,
      data: predictions,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        error: {
          error: 'Prediction failed',
          code: 'PREDICTION_ERROR',
          details: err instanceof Error ? err.message : String(err),
        },
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});
