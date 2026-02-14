/**
 * Core domain types for the fishing conditions app
 */

import { z } from 'zod';

// ============================================================================
// Geographic Types
// ============================================================================

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const RegionSchema = z.enum([
  'catskills',
  'croton',
  'raritan',
  'delaware',
  'connecticut',
  'nc-highcountry',
  'nc-foothills',
]);
export type Region = z.infer<typeof RegionSchema>;

export const StateSchema = z.enum(['NY', 'NJ', 'CT', 'NC']);
export type State = z.infer<typeof StateSchema>;

// ============================================================================
// Stream & Station Types
// ============================================================================

export const StreamSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: RegionSchema,
  state: StateSchema,
  stationIds: z.array(z.string()), // USGS station IDs
  coordinates: CoordinatesSchema.optional(),
});
export type Stream = z.infer<typeof StreamSchema>;

export const StationDataSchema = z.object({
  stationId: z.string(),
  stationName: z.string(),
  timestamp: z.string().datetime(),
  waterTempF: z.number().nullable(),
  waterTempC: z.number().nullable(),
  dischargeCfs: z.number().nullable(), // cubic feet per second
  gageHeightFt: z.number().nullable(),
  dataAvailability: z.lazy(() => DataAvailabilitySchema).optional(),
});
export type StationData = z.infer<typeof StationDataSchema>;

// ============================================================================
// Data Availability Types
// ============================================================================

export const ParameterStatusSchema = z.enum([
  'available', // valid reading present
  'not_equipped', // station does not monitor this parameter
  'sentinel', // USGS returned sentinel value (-999999, -99999)
  'no_data', // parameter expected but value missing/unparseable
]);
export type ParameterStatus = z.infer<typeof ParameterStatusSchema>;

export const DataAvailabilitySchema = z.object({
  waterTemp: ParameterStatusSchema,
  discharge: ParameterStatusSchema,
  gageHeight: ParameterStatusSchema,
});
export type DataAvailability = z.infer<typeof DataAvailabilitySchema>;

export const DataCompletenessSchema = z.enum(['full', 'partial', 'limited']);
export type DataCompleteness = z.infer<typeof DataCompletenessSchema>;

// ============================================================================
// Weather Types
// ============================================================================

export const WeatherConditionsSchema = z.object({
  timestamp: z.string().datetime(),
  airTempF: z.number(),
  cloudCoverPercent: z.number().min(0).max(100),
  precipProbability: z.number().min(0).max(100),
  windSpeedMph: z.number(),
  shortForecast: z.string(),
  isDaylight: z.boolean(),
});
export type WeatherConditions = z.infer<typeof WeatherConditionsSchema>;

export const HourlyForecastSchema = z.object({
  location: CoordinatesSchema,
  generatedAt: z.string().datetime(),
  periods: z.array(WeatherConditionsSchema),
});
export type HourlyForecast = z.infer<typeof HourlyForecastSchema>;

// ============================================================================
// Insect Hatch Types
// ============================================================================

export const InsectOrderSchema = z.enum(['mayfly', 'caddisfly', 'stonefly', 'midge']);
export type InsectOrder = z.infer<typeof InsectOrderSchema>;

export const HatchSchema = z.object({
  id: z.string(),
  commonName: z.string(),
  scientificName: z.string().optional(),
  order: InsectOrderSchema,
  minTempF: z.number(),
  maxTempF: z.number(),
  peakMonths: z.array(z.number().min(1).max(12)),
  timeOfDay: z.enum(['morning', 'midday', 'afternoon', 'evening', 'any']),
  prefersOvercast: z.boolean(),
  hookSizes: z.array(z.number()),
  notes: z.string().optional(),
});
export type Hatch = z.infer<typeof HatchSchema>;

// ============================================================================
// Prediction Types
// ============================================================================

export const HatchPredictionSchema = z.object({
  hatch: HatchSchema,
  probability: z.number().min(0).max(1),
  confidence: z.enum(['low', 'medium', 'high']),
  reasoning: z.string(),
});
export type HatchPrediction = z.infer<typeof HatchPredictionSchema>;

export const StreamConditionsSchema = z.object({
  stream: StreamSchema,
  timestamp: z.string().datetime(),
  stationData: z.array(StationDataSchema),
  weather: WeatherConditionsSchema.optional(),
  predictedHatches: z.array(HatchPredictionSchema),
  fishingQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
  summary: z.string(),
  dataCompleteness: DataCompletenessSchema.optional(),
});
export type StreamConditions = z.infer<typeof StreamConditionsSchema>;

// ============================================================================
// API Response Types
// ============================================================================

export type ApiErrorDetails = Array<{ message: string }> | string;

export const ApiErrorDetailsSchema = z.union([
  z.array(z.object({ message: z.string() }).passthrough()),
  z.string(),
]);

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: ApiErrorDetailsSchema.optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorSchema.optional(),
    timestamp: z.string().datetime(),
  });
