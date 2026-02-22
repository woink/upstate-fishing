/**
 * Access points and stream metadata schema tests.
 * Validates Zod schemas and migration SQL structure.
 */

import { assertEquals, assertThrows } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import {
  AccessPointSchema,
  AccessPointTypeSchema,
  DifficultyRatingSchema,
  RegulationTypeSchema,
  StreamMetadataSchema,
  StreamRegulationSchema,
  WadingSafetySchema,
} from '../../src/models/types.ts';

// ============================================================================
// AccessPointType Schema
// ============================================================================

describe('AccessPointTypeSchema', () => {
  it('accepts valid access point types', () => {
    assertEquals(AccessPointTypeSchema.parse('parking'), 'parking');
    assertEquals(AccessPointTypeSchema.parse('bridge'), 'bridge');
    assertEquals(AccessPointTypeSchema.parse('trail'), 'trail');
    assertEquals(AccessPointTypeSchema.parse('put-in'), 'put-in');
    assertEquals(AccessPointTypeSchema.parse('take-out'), 'take-out');
  });

  it('rejects invalid access point type', () => {
    assertThrows(() => AccessPointTypeSchema.parse('campsite'));
    assertThrows(() => AccessPointTypeSchema.parse(''));
  });
});

// ============================================================================
// AccessPoint Schema
// ============================================================================

describe('AccessPointSchema', () => {
  const validPoint = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    streamId: 'beaverkill',
    name: 'Cooks Falls Bridge',
    type: 'bridge' as const,
    latitude: 41.9450,
    longitude: -74.9780,
    description: 'Good wading access below the bridge',
    parkingAvailable: true,
    handicapAccessible: false,
    publicLand: true,
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-04-01T00:00:00Z',
  };

  it('accepts valid access point', () => {
    const result = AccessPointSchema.parse(validPoint);
    assertEquals(result.name, 'Cooks Falls Bridge');
    assertEquals(result.type, 'bridge');
    assertEquals(result.parkingAvailable, true);
  });

  it('accepts null description', () => {
    const result = AccessPointSchema.parse({ ...validPoint, description: null });
    assertEquals(result.description, null);
  });

  it('rejects invalid latitude', () => {
    assertThrows(() => AccessPointSchema.parse({ ...validPoint, latitude: 91 }));
    assertThrows(() => AccessPointSchema.parse({ ...validPoint, latitude: -91 }));
  });

  it('rejects invalid longitude', () => {
    assertThrows(() => AccessPointSchema.parse({ ...validPoint, longitude: 181 }));
    assertThrows(() => AccessPointSchema.parse({ ...validPoint, longitude: -181 }));
  });

  it('rejects invalid uuid', () => {
    assertThrows(() => AccessPointSchema.parse({ ...validPoint, id: 'bad-id' }));
  });

  it('rejects invalid type', () => {
    assertThrows(() => AccessPointSchema.parse({ ...validPoint, type: 'campsite' }));
  });
});

// ============================================================================
// RegulationType Schema
// ============================================================================

describe('RegulationTypeSchema', () => {
  it('accepts valid regulation types', () => {
    assertEquals(RegulationTypeSchema.parse('catch_and_release'), 'catch_and_release');
    assertEquals(RegulationTypeSchema.parse('trophy'), 'trophy');
    assertEquals(RegulationTypeSchema.parse('general'), 'general');
    assertEquals(RegulationTypeSchema.parse('delayed_harvest'), 'delayed_harvest');
    assertEquals(RegulationTypeSchema.parse('special'), 'special');
  });

  it('rejects invalid regulation type', () => {
    assertThrows(() => RegulationTypeSchema.parse('fly_only'));
  });
});

// ============================================================================
// DifficultyRating & WadingSafety Schemas
// ============================================================================

describe('DifficultyRatingSchema', () => {
  it('accepts valid ratings', () => {
    assertEquals(DifficultyRatingSchema.parse('easy'), 'easy');
    assertEquals(DifficultyRatingSchema.parse('moderate'), 'moderate');
    assertEquals(DifficultyRatingSchema.parse('difficult'), 'difficult');
    assertEquals(DifficultyRatingSchema.parse('expert'), 'expert');
  });

  it('rejects invalid rating', () => {
    assertThrows(() => DifficultyRatingSchema.parse('beginner'));
  });
});

describe('WadingSafetySchema', () => {
  it('accepts valid safety levels', () => {
    assertEquals(WadingSafetySchema.parse('safe'), 'safe');
    assertEquals(WadingSafetySchema.parse('moderate'), 'moderate');
    assertEquals(WadingSafetySchema.parse('caution'), 'caution');
    assertEquals(WadingSafetySchema.parse('dangerous'), 'dangerous');
  });

  it('rejects invalid safety level', () => {
    assertThrows(() => WadingSafetySchema.parse('extreme'));
  });
});

// ============================================================================
// StreamRegulation Schema
// ============================================================================

describe('StreamRegulationSchema', () => {
  const validReg = {
    id: 'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    streamId: 'beaverkill',
    regulationType: 'catch_and_release' as const,
    seasonStart: '2024-04-01',
    seasonEnd: '2024-09-30',
    specialRules: 'Artificial lures only',
    sourceUrl: 'https://dec.ny.gov/regulations',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('accepts valid regulation', () => {
    const result = StreamRegulationSchema.parse(validReg);
    assertEquals(result.regulationType, 'catch_and_release');
    assertEquals(result.specialRules, 'Artificial lures only');
  });

  it('accepts null nullable fields', () => {
    const result = StreamRegulationSchema.parse({
      ...validReg,
      seasonStart: null,
      seasonEnd: null,
      specialRules: null,
      sourceUrl: null,
    });
    assertEquals(result.seasonStart, null);
    assertEquals(result.sourceUrl, null);
  });

  it('rejects invalid regulation type', () => {
    assertThrows(() => StreamRegulationSchema.parse({ ...validReg, regulationType: 'barbless' }));
  });
});

// ============================================================================
// StreamMetadata Schema
// ============================================================================

describe('StreamMetadataSchema', () => {
  const validMeta = {
    id: 'd3ffbc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    streamId: 'beaverkill',
    difficultyRating: 'moderate' as const,
    wadingSafety: 'safe' as const,
    bestSeasons: ['spring', 'fall'],
    fishSpecies: ['brown trout', 'rainbow trout', 'brook trout'],
    stockingInfo: 'Stocked annually by NY DEC',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('accepts valid stream metadata', () => {
    const result = StreamMetadataSchema.parse(validMeta);
    assertEquals(result.streamId, 'beaverkill');
    assertEquals(result.bestSeasons, ['spring', 'fall']);
    assertEquals(result.fishSpecies.length, 3);
  });

  it('accepts null nullable fields', () => {
    const result = StreamMetadataSchema.parse({
      ...validMeta,
      difficultyRating: null,
      wadingSafety: null,
      stockingInfo: null,
    });
    assertEquals(result.difficultyRating, null);
    assertEquals(result.wadingSafety, null);
  });

  it('accepts empty arrays', () => {
    const result = StreamMetadataSchema.parse({
      ...validMeta,
      bestSeasons: [],
      fishSpecies: [],
    });
    assertEquals(result.bestSeasons.length, 0);
    assertEquals(result.fishSpecies.length, 0);
  });

  it('rejects invalid difficulty rating', () => {
    assertThrows(() => StreamMetadataSchema.parse({ ...validMeta, difficultyRating: 'beginner' }));
  });

  it('rejects invalid wading safety', () => {
    assertThrows(() => StreamMetadataSchema.parse({ ...validMeta, wadingSafety: 'extreme' }));
  });
});

// ============================================================================
// Migration SQL Structure
// ============================================================================

describe('access points migration SQL', () => {
  let sql: string;

  it('reads migration file', async () => {
    sql = await Deno.readTextFile(
      new URL(
        '../../supabase/migrations/00009_access_points_metadata.sql',
        import.meta.url,
      ),
    );
  });

  it('creates access_points table', () => {
    assertEquals(sql.includes('create table public.access_points'), true);
  });

  it('creates stream_regulations table', () => {
    assertEquals(sql.includes('create table public.stream_regulations'), true);
  });

  it('creates stream_metadata table', () => {
    assertEquals(sql.includes('create table public.stream_metadata'), true);
  });

  it('enables PostGIS extension', () => {
    assertEquals(sql.includes('create extension if not exists postgis'), true);
  });

  it('uses geography(Point, 4326) for location', () => {
    assertEquals(sql.includes('geography(Point, 4326)'), true);
  });

  it('creates spatial index on access_points', () => {
    assertEquals(sql.includes('using gist (location)'), true);
  });

  it('enforces unique stream_id on stream_metadata', () => {
    assertEquals(sql.includes('stream_id text not null unique'), true);
  });

  it('enables RLS on all three tables', () => {
    assertEquals(
      sql.includes('alter table public.access_points enable row level security'),
      true,
    );
    assertEquals(
      sql.includes('alter table public.stream_regulations enable row level security'),
      true,
    );
    assertEquals(
      sql.includes('alter table public.stream_metadata enable row level security'),
      true,
    );
  });

  it('uses existing update_updated_at trigger function', () => {
    const matches = sql.match(/execute function public\.update_updated_at\(\)/g);
    assertEquals(matches?.length, 3);
  });

  it('includes access point type constraint', () => {
    assertEquals(
      sql.includes("type in ('parking', 'bridge', 'trail', 'put-in', 'take-out')"),
      true,
    );
  });

  it('includes regulation type constraint', () => {
    assertEquals(
      sql.includes("'catch_and_release', 'trophy', 'general', 'delayed_harvest', 'special'"),
      true,
    );
  });
});
