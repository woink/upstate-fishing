import { Handlers } from '$fresh/server.ts';
import { z } from 'zod';
import { predictionService } from '@shared/services/predictions.ts';
import { fahrenheitToCelsius } from '@shared/utils/temperature.ts';
import { apiError } from '../../utils/api-response.ts';

const CUSTOM_STATION_ID = 'custom';
const CUSTOM_STATION_NAME = 'Custom Input';

/**
 * Default weather values when the user supplies airTempF but omits
 * individual weather fields.
 */
const WEATHER_DEFAULTS = {
  /** Partly cloudy; neutral baseline that neither boosts nor penalises overcast-preferring hatches. */
  cloudCoverPercent: 50,
  /** No rain; avoids false suppression of hatches sensitive to precipitation. */
  precipProbability: 0,
  /** Light breeze; typical calm trout-stream conditions. */
  windSpeedMph: 5,
  /** Most user queries target daytime fishing windows. */
  isDaylight: true,
} as const;

export const PredictRequestSchema = z.object({
  waterTempF: z.number().optional(),
  airTempF: z.number().optional(),
  cloudCoverPercent: z.number().min(0).max(100).optional(),
  precipProbability: z.number().min(0).max(100).optional(),
  date: z.string().datetime().optional(),
}).refine(
  (data) => data.waterTempF !== undefined || data.airTempF !== undefined,
  { message: 'At least one of waterTempF or airTempF is required' },
);

export const handler: Handlers = {
  async POST(req, _ctx) {
    let body;
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON in request body', 'INVALID_JSON', 400);
    }

    try {
      const parsed = PredictRequestSchema.safeParse(body);

      if (!parsed.success) {
        return apiError('Invalid request body', 'VALIDATION_ERROR', 400, parsed.error.issues);
      }

      const { waterTempF, airTempF, cloudCoverPercent, precipProbability, date } = parsed.data;

      const stationData = waterTempF
        ? [{
          stationId: CUSTOM_STATION_ID,
          stationName: CUSTOM_STATION_NAME,
          timestamp: new Date().toISOString(),
          waterTempF,
          waterTempC: fahrenheitToCelsius(waterTempF),
          dischargeCfs: null,
          gageHeightFt: null,
        }]
        : [];

      const weather = airTempF
        ? {
          timestamp: new Date().toISOString(),
          airTempF,
          cloudCoverPercent: cloudCoverPercent ?? WEATHER_DEFAULTS.cloudCoverPercent,
          precipProbability: precipProbability ?? WEATHER_DEFAULTS.precipProbability,
          windSpeedMph: WEATHER_DEFAULTS.windSpeedMph,
          shortForecast: 'Custom conditions',
          isDaylight: WEATHER_DEFAULTS.isDaylight,
        }
        : null;

      const predictions = predictionService.predictHatches(
        stationData,
        weather,
        date ? new Date(date) : new Date(),
      );

      return Response.json(
        { success: true, data: predictions, timestamp: new Date().toISOString() },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    } catch (err) {
      return apiError(
        'Prediction failed',
        'PREDICTION_ERROR',
        500,
        err instanceof Error ? err.message : String(err),
      );
    }
  },
};
