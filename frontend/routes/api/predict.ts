import { Handlers } from '$fresh/server.ts';
import { z } from 'zod';
import { predictionService } from '@shared/services/predictions.ts';
import { apiError } from '../../utils/api-response.ts';

const PredictRequestSchema = z.object({
  waterTempF: z.number().optional(),
  airTempF: z.number().optional(),
  cloudCoverPercent: z.number().min(0).max(100).optional(),
  precipProbability: z.number().min(0).max(100).optional(),
  date: z.string().datetime().optional(),
});

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const body = await req.json();
      const parsed = PredictRequestSchema.safeParse(body);

      if (!parsed.success) {
        return apiError('Invalid request body', 'VALIDATION_ERROR', 400, parsed.error.issues);
      }

      const { waterTempF, airTempF, cloudCoverPercent, precipProbability, date } = parsed.data;

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
