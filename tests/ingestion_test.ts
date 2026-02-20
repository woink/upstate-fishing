/**
 * Unit tests for the data ingestion service.
 * Tests mapping functions and result accumulation — no Supabase needed.
 */

import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { mapStationDataToReading, mapWeatherToSnapshot } from '../src/services/ingestion.ts';
import type { StationData, WeatherConditions } from '../src/models/types.ts';
import { StationReadingInsertSchema, WeatherSnapshotInsertSchema } from '../src/models/types.ts';

// ============================================================================
// mapStationDataToReading
// ============================================================================

describe('mapStationDataToReading', () => {
  it('maps a complete StationData to a StationReadingInsert', () => {
    const station: StationData = {
      stationId: '01420500',
      stationName: 'BEAVERKILL AT COOKS FALLS NY',
      timestamp: '2024-06-15T14:30:00.000Z',
      waterTempF: 58.5,
      waterTempC: 14.7,
      dischargeCfs: 245.0,
      gageHeightFt: 3.2,
    };

    const result = mapStationDataToReading(station);

    assertEquals(result.station_id, '01420500');
    assertEquals(result.station_name, 'BEAVERKILL AT COOKS FALLS NY');
    assertEquals(result.recorded_at, '2024-06-15T14:30:00.000Z');
    assertEquals(result.water_temp_f, 58.5);
    assertEquals(result.water_temp_c, 14.7);
    assertEquals(result.discharge_cfs, 245.0);
    assertEquals(result.gage_height_ft, 3.2);

    // Validate against the Zod schema
    const parsed = StationReadingInsertSchema.safeParse(result);
    assertEquals(parsed.success, true);
  });

  it('preserves null values for missing readings', () => {
    const station: StationData = {
      stationId: '01374505',
      stationName: 'EAST BRANCH CROTON RIVER',
      timestamp: '2024-06-15T14:30:00.000Z',
      waterTempF: null,
      waterTempC: null,
      dischargeCfs: 120.0,
      gageHeightFt: null,
    };

    const result = mapStationDataToReading(station);

    assertEquals(result.water_temp_f, null);
    assertEquals(result.water_temp_c, null);
    assertEquals(result.discharge_cfs, 120.0);
    assertEquals(result.gage_height_ft, null);

    const parsed = StationReadingInsertSchema.safeParse(result);
    assertEquals(parsed.success, true);
  });

  it('handles all-null readings (station equipped but no data)', () => {
    const station: StationData = {
      stationId: '01374654',
      stationName: 'MIDDLE BRANCH CROTON',
      timestamp: '2024-06-15T14:30:00.000Z',
      waterTempF: null,
      waterTempC: null,
      dischargeCfs: null,
      gageHeightFt: null,
    };

    const result = mapStationDataToReading(station);

    assertEquals(result.water_temp_f, null);
    assertEquals(result.water_temp_c, null);
    assertEquals(result.discharge_cfs, null);
    assertEquals(result.gage_height_ft, null);

    const parsed = StationReadingInsertSchema.safeParse(result);
    assertEquals(parsed.success, true);
  });
});

// ============================================================================
// mapWeatherToSnapshot
// ============================================================================

describe('mapWeatherToSnapshot', () => {
  const coords = { latitude: 41.9365, longitude: -74.9201 };

  it('maps WeatherConditions + coordinates to a WeatherSnapshotInsert', () => {
    const weather: WeatherConditions = {
      timestamp: '2024-06-15T14:00:00.000Z',
      airTempF: 72,
      cloudCoverPercent: 45,
      precipProbability: 10,
      windSpeedMph: 8,
      shortForecast: 'Partly Cloudy',
      isDaylight: true,
    };

    const result = mapWeatherToSnapshot(weather, coords);

    assertEquals(result.latitude, 41.9365);
    assertEquals(result.longitude, -74.9201);
    assertEquals(result.recorded_at, '2024-06-15T14:00:00.000Z');
    assertEquals(result.air_temp_f, 72);
    assertEquals(result.cloud_cover_percent, 45);
    assertEquals(result.precip_probability, 10);
    assertEquals(result.wind_speed_mph, 8);
    assertEquals(result.short_forecast, 'Partly Cloudy');

    const parsed = WeatherSnapshotInsertSchema.safeParse(result);
    assertEquals(parsed.success, true);
  });

  it('does not include isDaylight in the snapshot (DB does not store it)', () => {
    const weather: WeatherConditions = {
      timestamp: '2024-06-15T22:00:00.000Z',
      airTempF: 55,
      cloudCoverPercent: 80,
      precipProbability: 60,
      windSpeedMph: 12,
      shortForecast: 'Chance Rain',
      isDaylight: false,
    };

    const result = mapWeatherToSnapshot(weather, coords);
    const keys = Object.keys(result);
    assertEquals(keys.includes('isDaylight'), false);
    assertEquals(keys.includes('is_daylight'), false);
  });
});
