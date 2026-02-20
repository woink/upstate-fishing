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
  'sentinel', // USGS returned a numeric sentinel (noDataValue -999999 or legacy -99999)
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
// Fishing Quality Enum (extracted for reuse)
// ============================================================================

export const FishingQualitySchema = z.enum(['poor', 'fair', 'good', 'excellent']);
export type FishingQuality = z.infer<typeof FishingQualitySchema>;

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
  fishingQuality: FishingQualitySchema,
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

// ============================================================================
// User & Auth Types (Supabase)
// ============================================================================

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  homeLatitude: z.number().min(-90).max(90).nullable(),
  homeLongitude: z.number().min(-180).max(180).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const SavedStreamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  streamId: z.string(),
  createdAt: z.string().datetime(),
});
export type SavedStream = z.infer<typeof SavedStreamSchema>;

export const NotificationPreferencesSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  emailDailyReport: z.boolean(),
  emailHatchAlerts: z.boolean(),
  qualityThreshold: FishingQualitySchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

// ============================================================================
// Historical Data Types (Supabase)
// ============================================================================

export const StationReadingSchema = z.object({
  id: z.string().uuid(),
  stationId: z.string(),
  stationName: z.string(),
  recordedAt: z.string().datetime(),
  waterTempF: z.number().nullable(),
  waterTempC: z.number().nullable(),
  dischargeCfs: z.number().nullable(),
  gageHeightFt: z.number().nullable(),
  createdAt: z.string().datetime(),
});
export type StationReading = z.infer<typeof StationReadingSchema>;

export const WeatherSnapshotSchema = z.object({
  id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  recordedAt: z.string().datetime(),
  airTempF: z.number(),
  cloudCoverPercent: z.number().min(0).max(100),
  precipProbability: z.number().min(0).max(100),
  windSpeedMph: z.number(),
  shortForecast: z.string(),
  createdAt: z.string().datetime(),
});
export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;

// ============================================================================
// Spatial & Stats Types (Supabase)
// ============================================================================

export const NearbyStreamSchema = z.object({
  streamId: z.string(),
  name: z.string(),
  region: RegionSchema,
  state: StateSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  distanceMiles: z.number().positive(),
});
export type NearbyStream = z.infer<typeof NearbyStreamSchema>;

export const TrendDirectionSchema = z.enum(['rising', 'falling', 'stable', 'unknown']);
export type TrendDirection = z.infer<typeof TrendDirectionSchema>;

const StatsSummarySchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  avg: z.number().nullable(),
  trend: TrendDirectionSchema,
});

export const StationStatsSchema = z.object({
  stationId: z.string(),
  days: z.number().int().positive(),
  waterTemp: StatsSummarySchema,
  discharge: StatsSummarySchema,
  gageHeight: StatsSummarySchema,
});
export type StationStats = z.infer<typeof StationStatsSchema>;

// ============================================================================
// Data Ingestion Types
// ============================================================================

export const IngestionTableSchema = z.enum(['station_readings', 'weather_snapshots']);
export type IngestionTable = z.infer<typeof IngestionTableSchema>;

export const IngestionResultSchema = z.object({
  table: IngestionTableSchema,
  inserted: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
});
export type IngestionResult = z.infer<typeof IngestionResultSchema>;

/** Shape of a row inserted into station_readings (excludes id/created_at auto-columns). */
export const StationReadingInsertSchema = z.object({
  station_id: z.string(),
  station_name: z.string(),
  recorded_at: z.string().datetime(),
  water_temp_f: z.number().nullable(),
  water_temp_c: z.number().nullable(),
  discharge_cfs: z.number().nullable(),
  gage_height_ft: z.number().nullable(),
});
export type StationReadingInsert = z.infer<typeof StationReadingInsertSchema>;

/** Shape of a row inserted into weather_snapshots (excludes id/created_at auto-columns). */
export const WeatherSnapshotInsertSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  recorded_at: z.string().datetime(),
  air_temp_f: z.number(),
  cloud_cover_percent: z.number(),
  precip_probability: z.number(),
  wind_speed_mph: z.number(),
  short_forecast: z.string(),
});
export type WeatherSnapshotInsert = z.infer<typeof WeatherSnapshotInsertSchema>;
