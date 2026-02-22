/**
 * Type validation tests
 * Tests Zod schemas for runtime validation
 */

import { assertEquals, assertThrows } from '@std/assert';
import {
  AccessPointSchema,
  AccessPointTypeSchema,
  CoordinatesSchema,
  DifficultyRatingSchema,
  FishingQualitySchema,
  FishingReportSchema,
  HatchSchema,
  NearbyStreamSchema,
  NotificationPreferencesSchema,
  RegionSchema,
  ReportSourceSchema,
  ReportSourceTypeSchema,
  SavedStreamSchema,
  StationDataSchema,
  StationReadingSchema,
  StationStatsSchema,
  StreamMetadataSchema,
  StreamRegulationSchema,
  StreamSchema,
  TrendDirectionSchema,
  UserProfileSchema,
  WadingSafetySchema,
  WeatherConditionsSchema,
  WeatherSnapshotSchema,
} from '../src/models/types.ts';

// ============================================================================
// Coordinates Schema Tests
// ============================================================================

Deno.test('CoordinatesSchema - accepts valid coordinates', () => {
  const valid = { latitude: 41.9365, longitude: -74.9201 };
  const result = CoordinatesSchema.parse(valid);
  assertEquals(result.latitude, 41.9365);
  assertEquals(result.longitude, -74.9201);
});

Deno.test('CoordinatesSchema - accepts edge case coordinates', () => {
  // North Pole
  const northPole = CoordinatesSchema.parse({ latitude: 90, longitude: 0 });
  assertEquals(northPole.latitude, 90);

  // South Pole
  const southPole = CoordinatesSchema.parse({ latitude: -90, longitude: 0 });
  assertEquals(southPole.latitude, -90);

  // International Date Line
  const dateLine = CoordinatesSchema.parse({ latitude: 0, longitude: 180 });
  assertEquals(dateLine.longitude, 180);

  const dateLineNeg = CoordinatesSchema.parse({ latitude: 0, longitude: -180 });
  assertEquals(dateLineNeg.longitude, -180);
});

Deno.test('CoordinatesSchema - rejects invalid latitude', () => {
  assertThrows(() => {
    CoordinatesSchema.parse({ latitude: 91, longitude: 0 });
  });

  assertThrows(() => {
    CoordinatesSchema.parse({ latitude: -91, longitude: 0 });
  });
});

Deno.test('CoordinatesSchema - rejects invalid longitude', () => {
  assertThrows(() => {
    CoordinatesSchema.parse({ latitude: 0, longitude: 181 });
  });

  assertThrows(() => {
    CoordinatesSchema.parse({ latitude: 0, longitude: -181 });
  });
});

// ============================================================================
// Region Schema Tests
// ============================================================================

Deno.test('RegionSchema - accepts valid regions', () => {
  assertEquals(RegionSchema.parse('catskills'), 'catskills');
  assertEquals(RegionSchema.parse('croton'), 'croton');
  assertEquals(RegionSchema.parse('raritan'), 'raritan');
  assertEquals(RegionSchema.parse('delaware'), 'delaware');
});

Deno.test('RegionSchema - rejects invalid region', () => {
  assertThrows(() => {
    RegionSchema.parse('adirondacks');
  });
});

// ============================================================================
// Stream Schema Tests
// ============================================================================

Deno.test('StreamSchema - accepts valid stream', () => {
  const valid = {
    id: 'beaverkill',
    name: 'Beaverkill',
    region: 'catskills',
    state: 'NY',
    stationIds: ['01420500', '01418500'],
  };
  const result = StreamSchema.parse(valid);
  assertEquals(result.id, 'beaverkill');
  assertEquals(result.stationIds.length, 2);
});

Deno.test('StreamSchema - accepts stream with coordinates', () => {
  const valid = {
    id: 'beaverkill',
    name: 'Beaverkill',
    region: 'catskills',
    state: 'NY',
    stationIds: ['01420500'],
    coordinates: { latitude: 41.9365, longitude: -74.9201 },
  };
  const result = StreamSchema.parse(valid);
  assertEquals(result.coordinates?.latitude, 41.9365);
});

Deno.test('StreamSchema - rejects invalid state', () => {
  assertThrows(() => {
    StreamSchema.parse({
      id: 'test',
      name: 'Test Stream',
      region: 'catskills',
      state: 'PA', // Not NY or NJ
      stationIds: [],
    });
  });
});

// ============================================================================
// Station Data Schema Tests
// ============================================================================

Deno.test('StationDataSchema - accepts valid station data', () => {
  const valid = {
    stationId: '01420500',
    stationName: 'BEAVERKILL AT COOKS FALLS NY',
    timestamp: '2024-04-15T14:00:00Z',
    waterTempF: 54,
    waterTempC: 12.2,
    dischargeCfs: 150,
    gageHeightFt: 2.5,
  };
  const result = StationDataSchema.parse(valid);
  assertEquals(result.stationId, '01420500');
  assertEquals(result.waterTempF, 54);
});

Deno.test('StationDataSchema - accepts null values for optional readings', () => {
  const valid = {
    stationId: '01420500',
    stationName: 'Test Station',
    timestamp: '2024-04-15T14:00:00Z',
    waterTempF: null,
    waterTempC: null,
    dischargeCfs: null,
    gageHeightFt: null,
  };
  const result = StationDataSchema.parse(valid);
  assertEquals(result.waterTempF, null);
});

Deno.test('StationDataSchema - rejects invalid timestamp', () => {
  assertThrows(() => {
    StationDataSchema.parse({
      stationId: '01420500',
      stationName: 'Test',
      timestamp: 'not-a-date',
      waterTempF: 54,
      waterTempC: 12.2,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
    });
  });
});

// ============================================================================
// Weather Conditions Schema Tests
// ============================================================================

Deno.test('WeatherConditionsSchema - accepts valid weather', () => {
  const valid = {
    timestamp: '2024-04-15T14:00:00Z',
    airTempF: 58,
    cloudCoverPercent: 80,
    precipProbability: 20,
    windSpeedMph: 8,
    shortForecast: 'Mostly Cloudy',
    isDaylight: true,
  };
  const result = WeatherConditionsSchema.parse(valid);
  assertEquals(result.airTempF, 58);
  assertEquals(result.cloudCoverPercent, 80);
});

Deno.test('WeatherConditionsSchema - rejects cloud cover over 100', () => {
  assertThrows(() => {
    WeatherConditionsSchema.parse({
      timestamp: '2024-04-15T14:00:00Z',
      airTempF: 58,
      cloudCoverPercent: 101,
      precipProbability: 20,
      windSpeedMph: 8,
      shortForecast: 'Cloudy',
      isDaylight: true,
    });
  });
});

Deno.test('WeatherConditionsSchema - rejects negative precipitation probability', () => {
  assertThrows(() => {
    WeatherConditionsSchema.parse({
      timestamp: '2024-04-15T14:00:00Z',
      airTempF: 58,
      cloudCoverPercent: 50,
      precipProbability: -5,
      windSpeedMph: 8,
      shortForecast: 'Cloudy',
      isDaylight: true,
    });
  });
});

// ============================================================================
// Hatch Schema Tests
// ============================================================================

Deno.test('HatchSchema - accepts valid hatch', () => {
  const valid = {
    id: 'hendrickson',
    commonName: 'Hendrickson',
    scientificName: 'Ephemerella subvaria',
    order: 'mayfly',
    minTempF: 50,
    maxTempF: 58,
    peakMonths: [4, 5],
    timeOfDay: 'afternoon',
    prefersOvercast: true,
    hookSizes: [12, 14],
    notes: 'Start of dry fly season.',
  };
  const result = HatchSchema.parse(valid);
  assertEquals(result.id, 'hendrickson');
  assertEquals(result.order, 'mayfly');
});

Deno.test('HatchSchema - rejects invalid insect order', () => {
  assertThrows(() => {
    HatchSchema.parse({
      id: 'test',
      commonName: 'Test',
      order: 'butterfly', // Invalid order
      minTempF: 50,
      maxTempF: 60,
      peakMonths: [5],
      timeOfDay: 'any',
      prefersOvercast: false,
      hookSizes: [14],
    });
  });
});

Deno.test('HatchSchema - rejects invalid month', () => {
  assertThrows(() => {
    HatchSchema.parse({
      id: 'test',
      commonName: 'Test',
      order: 'mayfly',
      minTempF: 50,
      maxTempF: 60,
      peakMonths: [13], // Invalid month
      timeOfDay: 'any',
      prefersOvercast: false,
      hookSizes: [14],
    });
  });
});

// ============================================================================
// FishingQuality Schema Tests
// ============================================================================

Deno.test('FishingQualitySchema - accepts valid qualities', () => {
  assertEquals(FishingQualitySchema.parse('excellent'), 'excellent');
  assertEquals(FishingQualitySchema.parse('good'), 'good');
  assertEquals(FishingQualitySchema.parse('fair'), 'fair');
  assertEquals(FishingQualitySchema.parse('poor'), 'poor');
});

Deno.test('FishingQualitySchema - rejects invalid quality', () => {
  assertThrows(() => {
    FishingQualitySchema.parse('amazing');
  });
});

// ============================================================================
// UserProfile Schema Tests
// ============================================================================

Deno.test('UserProfileSchema - accepts valid profile', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    displayName: 'Angler Joe',
    avatarUrl: 'https://example.com/avatar.jpg',
    homeLatitude: 41.9365,
    homeLongitude: -74.9201,
    createdAt: '2024-04-15T14:00:00Z',
    updatedAt: '2024-04-15T14:00:00Z',
  };
  const result = UserProfileSchema.parse(valid);
  assertEquals(result.id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  assertEquals(result.displayName, 'Angler Joe');
});

Deno.test('UserProfileSchema - accepts nullable home coordinates', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    displayName: null,
    avatarUrl: null,
    homeLatitude: null,
    homeLongitude: null,
    createdAt: '2024-04-15T14:00:00Z',
    updatedAt: '2024-04-15T14:00:00Z',
  };
  const result = UserProfileSchema.parse(valid);
  assertEquals(result.homeLatitude, null);
  assertEquals(result.homeLongitude, null);
});

Deno.test('UserProfileSchema - accepts relative avatar storage path', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    displayName: 'Angler Joe',
    avatarUrl: 'avatars/user123.jpg',
    homeLatitude: null,
    homeLongitude: null,
    createdAt: '2024-04-15T14:00:00Z',
    updatedAt: '2024-04-15T14:00:00Z',
  };
  const result = UserProfileSchema.parse(valid);
  assertEquals(result.avatarUrl, 'avatars/user123.jpg');
});

Deno.test('UserProfileSchema - rejects invalid uuid', () => {
  assertThrows(() => {
    UserProfileSchema.parse({
      id: 'not-a-uuid',
      displayName: null,
      avatarUrl: null,
      homeLatitude: null,
      homeLongitude: null,
      createdAt: '2024-04-15T14:00:00Z',
      updatedAt: '2024-04-15T14:00:00Z',
    });
  });
});

Deno.test('UserProfileSchema - rejects invalid homeLatitude', () => {
  assertThrows(() => {
    UserProfileSchema.parse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      displayName: null,
      avatarUrl: null,
      homeLatitude: 91,
      homeLongitude: -74,
      createdAt: '2024-04-15T14:00:00Z',
      updatedAt: '2024-04-15T14:00:00Z',
    });
  });
});

// ============================================================================
// SavedStream Schema Tests
// ============================================================================

Deno.test('SavedStreamSchema - accepts valid saved stream', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    streamId: 'beaverkill',
    createdAt: '2024-04-15T14:00:00Z',
  };
  const result = SavedStreamSchema.parse(valid);
  assertEquals(result.streamId, 'beaverkill');
});

Deno.test('SavedStreamSchema - requires userId and streamId', () => {
  assertThrows(() => {
    SavedStreamSchema.parse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      createdAt: '2024-04-15T14:00:00Z',
    });
  });
});

// ============================================================================
// NotificationPreferences Schema Tests
// ============================================================================

Deno.test('NotificationPreferencesSchema - accepts valid preferences', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    emailDailyReport: true,
    emailHatchAlerts: false,
    qualityThreshold: 'good',
    createdAt: '2024-04-15T14:00:00Z',
    updatedAt: '2024-04-15T14:00:00Z',
  };
  const result = NotificationPreferencesSchema.parse(valid);
  assertEquals(result.emailDailyReport, true);
  assertEquals(result.qualityThreshold, 'good');
});

Deno.test('NotificationPreferencesSchema - qualityThreshold must be FishingQuality', () => {
  assertThrows(() => {
    NotificationPreferencesSchema.parse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      emailDailyReport: true,
      emailHatchAlerts: false,
      qualityThreshold: 'amazing',
      createdAt: '2024-04-15T14:00:00Z',
      updatedAt: '2024-04-15T14:00:00Z',
    });
  });
});

// ============================================================================
// StationReading Schema Tests
// ============================================================================

Deno.test('StationReadingSchema - accepts valid reading', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    stationId: '01420500',
    stationName: 'BEAVERKILL AT COOKS FALLS NY',
    recordedAt: '2024-04-15T14:00:00Z',
    waterTempF: 54,
    waterTempC: 12.2,
    dischargeCfs: 150,
    gageHeightFt: 2.5,
    createdAt: '2024-04-15T14:05:00Z',
  };
  const result = StationReadingSchema.parse(valid);
  assertEquals(result.stationId, '01420500');
  assertEquals(result.createdAt, '2024-04-15T14:05:00Z');
});

Deno.test('StationReadingSchema - accepts nullable number fields', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    stationId: '01420500',
    stationName: 'Test Station',
    recordedAt: '2024-04-15T14:00:00Z',
    waterTempF: null,
    waterTempC: null,
    dischargeCfs: null,
    gageHeightFt: null,
    createdAt: '2024-04-15T14:05:00Z',
  };
  const result = StationReadingSchema.parse(valid);
  assertEquals(result.waterTempF, null);
});

Deno.test('StationReadingSchema - requires recordedAt datetime', () => {
  assertThrows(() => {
    StationReadingSchema.parse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      stationId: '01420500',
      stationName: 'Test',
      recordedAt: 'not-a-date',
      waterTempF: 54,
      waterTempC: 12.2,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      createdAt: '2024-04-15T14:05:00Z',
    });
  });
});

// ============================================================================
// WeatherSnapshot Schema Tests
// ============================================================================

Deno.test('WeatherSnapshotSchema - accepts valid snapshot', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    latitude: 41.9365,
    longitude: -74.9201,
    recordedAt: '2024-04-15T14:00:00Z',
    airTempF: 58,
    cloudCoverPercent: 80,
    precipProbability: 20,
    windSpeedMph: 8,
    shortForecast: 'Mostly Cloudy',
    createdAt: '2024-04-15T14:05:00Z',
  };
  const result = WeatherSnapshotSchema.parse(valid);
  assertEquals(result.airTempF, 58);
  assertEquals(result.createdAt, '2024-04-15T14:05:00Z');
});

Deno.test('WeatherSnapshotSchema - rejects cloud cover over 100', () => {
  assertThrows(() => {
    WeatherSnapshotSchema.parse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      latitude: 41.9365,
      longitude: -74.9201,
      recordedAt: '2024-04-15T14:00:00Z',
      airTempF: 58,
      cloudCoverPercent: 101,
      precipProbability: 20,
      windSpeedMph: 8,
      shortForecast: 'Cloudy',
      createdAt: '2024-04-15T14:05:00Z',
    });
  });
});

// ============================================================================
// NearbyStream Schema Tests
// ============================================================================

Deno.test('NearbyStreamSchema - accepts valid nearby stream', () => {
  const valid = {
    streamId: 'beaverkill',
    name: 'Beaverkill',
    region: 'catskills',
    state: 'NY',
    latitude: 41.9365,
    longitude: -74.9201,
    distanceMiles: 5.3,
  };
  const result = NearbyStreamSchema.parse(valid);
  assertEquals(result.distanceMiles, 5.3);
});

Deno.test('NearbyStreamSchema - accepts zero distance', () => {
  const result = NearbyStreamSchema.parse({
    streamId: 'beaverkill',
    name: 'Beaverkill',
    region: 'catskills',
    state: 'NY',
    latitude: 41.9365,
    longitude: -74.9201,
    distanceMiles: 0,
  });
  assertEquals(result.distanceMiles, 0);
});

Deno.test('NearbyStreamSchema - rejects negative distance', () => {
  assertThrows(() => {
    NearbyStreamSchema.parse({
      streamId: 'beaverkill',
      name: 'Beaverkill',
      region: 'catskills',
      state: 'NY',
      latitude: 41.9365,
      longitude: -74.9201,
      distanceMiles: -1,
    });
  });
});

// ============================================================================
// TrendDirection Schema Tests
// ============================================================================

Deno.test('TrendDirectionSchema - accepts valid directions', () => {
  assertEquals(TrendDirectionSchema.parse('rising'), 'rising');
  assertEquals(TrendDirectionSchema.parse('falling'), 'falling');
  assertEquals(TrendDirectionSchema.parse('stable'), 'stable');
  assertEquals(TrendDirectionSchema.parse('unknown'), 'unknown');
});

Deno.test('TrendDirectionSchema - rejects invalid direction', () => {
  assertThrows(() => {
    TrendDirectionSchema.parse('plummeting');
  });
});

// ============================================================================
// StationStats Schema Tests
// ============================================================================

Deno.test('StationStatsSchema - accepts valid stats', () => {
  const valid = {
    stationId: '01420500',
    days: 7,
    waterTemp: { min: 48, max: 58, avg: 53, trend: 'rising' },
    discharge: { min: 100, max: 250, avg: 175, trend: 'falling' },
    gageHeight: { min: 2.0, max: 3.5, avg: 2.8, trend: 'stable' },
  };
  const result = StationStatsSchema.parse(valid);
  assertEquals(result.stationId, '01420500');
  assertEquals(result.days, 7);
  assertEquals(result.waterTemp.trend, 'rising');
});

Deno.test('StationStatsSchema - accepts nullable stats values', () => {
  const valid = {
    stationId: '01420500',
    days: 30,
    waterTemp: { min: null, max: null, avg: null, trend: 'unknown' },
    discharge: { min: 100, max: 250, avg: 175, trend: 'stable' },
    gageHeight: { min: null, max: null, avg: null, trend: 'unknown' },
  };
  const result = StationStatsSchema.parse(valid);
  assertEquals(result.waterTemp.min, null);
  assertEquals(result.waterTemp.trend, 'unknown');
});

Deno.test('StationStatsSchema - requires positive days', () => {
  assertThrows(() => {
    StationStatsSchema.parse({
      stationId: '01420500',
      days: 0,
      waterTemp: { min: null, max: null, avg: null, trend: 'unknown' },
      discharge: { min: null, max: null, avg: null, trend: 'unknown' },
      gageHeight: { min: null, max: null, avg: null, trend: 'unknown' },
    });
  });
});

// ============================================================================
// ReportSourceType Schema Tests
// ============================================================================

Deno.test('ReportSourceTypeSchema - accepts valid source types', () => {
  assertEquals(ReportSourceTypeSchema.parse('rss'), 'rss');
  assertEquals(ReportSourceTypeSchema.parse('scrape'), 'scrape');
  assertEquals(ReportSourceTypeSchema.parse('api'), 'api');
  assertEquals(ReportSourceTypeSchema.parse('manual'), 'manual');
});

Deno.test('ReportSourceTypeSchema - rejects invalid type', () => {
  assertThrows(() => ReportSourceTypeSchema.parse('email'));
});

// ============================================================================
// ReportSource Schema Tests
// ============================================================================

Deno.test('ReportSourceSchema - accepts valid report source', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Beaverkill Angler Reports',
    type: 'rss',
    url: 'https://beaverkillangler.com/feed',
    lastFetchedAt: '2024-04-15T14:00:00Z',
    fetchFrequencyMinutes: 60,
    active: true,
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-04-15T14:00:00Z',
  };
  const result = ReportSourceSchema.parse(valid);
  assertEquals(result.name, 'Beaverkill Angler Reports');
  assertEquals(result.type, 'rss');
});

Deno.test('ReportSourceSchema - rejects non-positive fetch frequency', () => {
  assertThrows(() =>
    ReportSourceSchema.parse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Test',
      type: 'rss',
      url: null,
      lastFetchedAt: null,
      fetchFrequencyMinutes: 0,
      active: true,
      createdAt: '2024-04-01T00:00:00Z',
      updatedAt: '2024-04-01T00:00:00Z',
    })
  );
});

// ============================================================================
// FishingReport Schema Tests
// ============================================================================

Deno.test('FishingReportSchema - accepts valid fishing report', () => {
  const valid = {
    id: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    streamId: 'beaverkill',
    sourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    sourceUrl: 'https://example.com/report/123',
    reportDate: '2024-04-15',
    rawText: 'Good fishing today.',
    waterTempMentioned: 54.5,
    flowMentioned: 200,
    confidenceScore: 0.85,
    createdAt: '2024-04-15T18:00:00Z',
    updatedAt: '2024-04-15T18:00:00Z',
  };
  const result = FishingReportSchema.parse(valid);
  assertEquals(result.streamId, 'beaverkill');
  assertEquals(result.confidenceScore, 0.85);
});

Deno.test('FishingReportSchema - rejects confidence score out of range', () => {
  assertThrows(() =>
    FishingReportSchema.parse({
      id: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380b22',
      streamId: 'beaverkill',
      sourceId: null,
      sourceUrl: null,
      reportDate: '2024-04-15',
      rawText: 'Text',
      waterTempMentioned: null,
      flowMentioned: null,
      confidenceScore: 1.5,
      createdAt: '2024-04-15T18:00:00Z',
      updatedAt: '2024-04-15T18:00:00Z',
    })
  );
});

// ============================================================================
// AccessPointType Schema Tests
// ============================================================================

Deno.test('AccessPointTypeSchema - accepts valid types', () => {
  assertEquals(AccessPointTypeSchema.parse('parking'), 'parking');
  assertEquals(AccessPointTypeSchema.parse('bridge'), 'bridge');
  assertEquals(AccessPointTypeSchema.parse('trail'), 'trail');
  assertEquals(AccessPointTypeSchema.parse('put-in'), 'put-in');
  assertEquals(AccessPointTypeSchema.parse('take-out'), 'take-out');
});

Deno.test('AccessPointTypeSchema - rejects invalid type', () => {
  assertThrows(() => AccessPointTypeSchema.parse('campsite'));
});

// ============================================================================
// AccessPoint Schema Tests
// ============================================================================

Deno.test('AccessPointSchema - accepts valid access point', () => {
  const valid = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    streamId: 'beaverkill',
    name: 'Cooks Falls Bridge',
    type: 'bridge',
    latitude: 41.9450,
    longitude: -74.9780,
    description: 'Good wading access below the bridge',
    parkingAvailable: true,
    handicapAccessible: false,
    publicLand: true,
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-04-01T00:00:00Z',
  };
  const result = AccessPointSchema.parse(valid);
  assertEquals(result.name, 'Cooks Falls Bridge');
  assertEquals(result.type, 'bridge');
});

Deno.test('AccessPointSchema - rejects invalid coordinates', () => {
  assertThrows(() =>
    AccessPointSchema.parse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      streamId: 'beaverkill',
      name: 'Test',
      type: 'parking',
      latitude: 91,
      longitude: -74,
      description: null,
      parkingAvailable: false,
      handicapAccessible: false,
      publicLand: true,
      createdAt: '2024-04-01T00:00:00Z',
      updatedAt: '2024-04-01T00:00:00Z',
    })
  );
});

// ============================================================================
// DifficultyRating & WadingSafety Schema Tests
// ============================================================================

Deno.test('DifficultyRatingSchema - accepts valid ratings', () => {
  assertEquals(DifficultyRatingSchema.parse('easy'), 'easy');
  assertEquals(DifficultyRatingSchema.parse('expert'), 'expert');
});

Deno.test('DifficultyRatingSchema - rejects invalid rating', () => {
  assertThrows(() => DifficultyRatingSchema.parse('beginner'));
});

Deno.test('WadingSafetySchema - accepts valid safety levels', () => {
  assertEquals(WadingSafetySchema.parse('safe'), 'safe');
  assertEquals(WadingSafetySchema.parse('dangerous'), 'dangerous');
});

Deno.test('WadingSafetySchema - rejects invalid safety level', () => {
  assertThrows(() => WadingSafetySchema.parse('extreme'));
});

// ============================================================================
// StreamRegulation Schema Tests
// ============================================================================

Deno.test('StreamRegulationSchema - accepts valid regulation', () => {
  const valid = {
    id: 'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    streamId: 'beaverkill',
    regulationType: 'catch_and_release',
    seasonStart: '2024-04-01',
    seasonEnd: '2024-09-30',
    specialRules: 'Artificial lures only',
    sourceUrl: 'https://dec.ny.gov/regulations',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
  const result = StreamRegulationSchema.parse(valid);
  assertEquals(result.regulationType, 'catch_and_release');
});

Deno.test('StreamRegulationSchema - rejects invalid regulation type', () => {
  assertThrows(() =>
    StreamRegulationSchema.parse({
      id: 'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380c33',
      streamId: 'beaverkill',
      regulationType: 'barbless',
      seasonStart: null,
      seasonEnd: null,
      specialRules: null,
      sourceUrl: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })
  );
});

// ============================================================================
// StreamMetadata Schema Tests
// ============================================================================

Deno.test('StreamMetadataSchema - accepts valid metadata', () => {
  const valid = {
    id: 'd3ffbc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    streamId: 'beaverkill',
    difficultyRating: 'moderate',
    wadingSafety: 'safe',
    bestSeasons: ['spring', 'fall'],
    fishSpecies: ['brown trout', 'rainbow trout'],
    stockingInfo: 'Stocked annually',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
  const result = StreamMetadataSchema.parse(valid);
  assertEquals(result.bestSeasons.length, 2);
  assertEquals(result.fishSpecies.length, 2);
});

Deno.test('StreamMetadataSchema - accepts nullable optional fields', () => {
  const valid = {
    id: 'd3ffbc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    streamId: 'beaverkill',
    difficultyRating: null,
    wadingSafety: null,
    bestSeasons: [],
    fishSpecies: [],
    stockingInfo: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
  const result = StreamMetadataSchema.parse(valid);
  assertEquals(result.difficultyRating, null);
  assertEquals(result.wadingSafety, null);
});
