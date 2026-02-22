/**
 * Fly shops Supabase schema tests.
 * Validates Zod schemas, migration SQL structure, and seed data.
 */

import { assertEquals, assertThrows } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { FlyShopSchema, FlyShopSupabaseSchema } from '../../src/models/types.ts';
import { FLY_SHOPS } from '../../src/data/fly-shops.ts';

// ============================================================================
// FlyShopSchema (base, backward-compatible)
// ============================================================================

describe('FlyShopSchema', () => {
  it('validates all static fly shop entries', () => {
    for (const shop of FLY_SHOPS) {
      const result = FlyShopSchema.safeParse(shop);
      assertEquals(result.success, true, `Failed to validate shop: ${shop.id}`);
    }
  });
});

// ============================================================================
// FlyShopSupabaseSchema (extended)
// ============================================================================

describe('FlyShopSupabaseSchema', () => {
  const validShop = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    slug: 'beaverkill-angler',
    name: 'Beaverkill Angler',
    region: 'catskills' as const,
    state: 'NY' as const,
    address: '2978 Old Route 17, Roscoe, NY 12776',
    coordinates: { latitude: 41.9365, longitude: -74.9101 },
    phone: '(607) 498-5194',
    website: 'https://beaverkillangler.com',
    description: 'Full service fly shop.',
    hours: { monday: '9am-5pm', tuesday: '9am-5pm' },
    services: ['guides', 'rentals', 'instruction'],
    brandsCarried: ['Orvis', 'Simms'],
    guideService: true,
    onlineStoreUrl: 'https://beaverkillangler.com/shop',
    reportSourceId: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    rating: 4.8,
    verified: true,
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-04-15T14:00:00Z',
  };

  it('accepts valid extended fly shop', () => {
    const result = FlyShopSupabaseSchema.parse(validShop);
    assertEquals(result.slug, 'beaverkill-angler');
    assertEquals(result.guideService, true);
    assertEquals(result.rating, 4.8);
    assertEquals(result.verified, true);
  });

  it('accepts null optional fields', () => {
    const result = FlyShopSupabaseSchema.parse({
      ...validShop,
      hours: null,
      onlineStoreUrl: null,
      reportSourceId: null,
      rating: null,
    });
    assertEquals(result.hours, null);
    assertEquals(result.onlineStoreUrl, null);
    assertEquals(result.reportSourceId, null);
    assertEquals(result.rating, null);
  });

  it('accepts omitted optional fields', () => {
    const {
      hours: _h,
      services: _s,
      brandsCarried: _b,
      onlineStoreUrl: _o,
      reportSourceId: _r,
      rating: _rt,
      ...minimal
    } = validShop;
    const result = FlyShopSupabaseSchema.parse(minimal);
    assertEquals(result.hours, undefined);
    assertEquals(result.services, undefined);
  });

  it('requires uuid for id', () => {
    assertThrows(() =>
      FlyShopSupabaseSchema.parse({
        ...validShop,
        id: 'beaverkill-angler',
      })
    );
  });

  it('rejects rating above 5', () => {
    assertThrows(() =>
      FlyShopSupabaseSchema.parse({
        ...validShop,
        rating: 5.1,
      })
    );
  });

  it('rejects rating below 0', () => {
    assertThrows(() =>
      FlyShopSupabaseSchema.parse({
        ...validShop,
        rating: -0.1,
      })
    );
  });

  it('accepts boundary ratings', () => {
    const zero = FlyShopSupabaseSchema.parse({ ...validShop, rating: 0 });
    assertEquals(zero.rating, 0);
    const five = FlyShopSupabaseSchema.parse({ ...validShop, rating: 5 });
    assertEquals(five.rating, 5);
  });

  it('requires slug field', () => {
    const { slug: _, ...noSlug } = validShop;
    assertThrows(() => FlyShopSupabaseSchema.parse(noSlug));
  });
});

// ============================================================================
// Migration SQL Structure
// ============================================================================

describe('fly shops migration SQL', () => {
  let sql: string;

  it('reads migration file', async () => {
    sql = await Deno.readTextFile(
      new URL(
        '../../supabase/migrations/00010_fly_shops.sql',
        import.meta.url,
      ),
    );
  });

  it('creates fly_shops table', () => {
    assertEquals(sql.includes('create table public.fly_shops'), true);
  });

  it('includes unique slug constraint', () => {
    assertEquals(sql.includes('slug text not null unique'), true);
  });

  it('uses geography(Point, 4326) for location', () => {
    assertEquals(sql.includes('geography(Point, 4326)'), true);
  });

  it('includes FK to report_sources', () => {
    assertEquals(
      sql.includes('references public.report_sources(id) on delete set null'),
      true,
    );
  });

  it('includes rating check constraint', () => {
    assertEquals(
      sql.includes('rating >= 0 and rating <= 5'),
      true,
    );
  });

  it('creates spatial index', () => {
    assertEquals(sql.includes('using gist (location)'), true);
  });

  it('creates region and state indexes', () => {
    assertEquals(sql.includes('idx_fly_shops_region'), true);
    assertEquals(sql.includes('idx_fly_shops_state'), true);
  });

  it('enables RLS', () => {
    assertEquals(
      sql.includes('alter table public.fly_shops enable row level security'),
      true,
    );
  });

  it('uses existing update_updated_at trigger function', () => {
    assertEquals(
      sql.includes('execute function public.update_updated_at()'),
      true,
    );
  });
});

// ============================================================================
// Seed SQL Structure
// ============================================================================

describe('fly shops seed SQL', () => {
  let seed: string;

  it('reads seed file', async () => {
    seed = await Deno.readTextFile(
      new URL(
        '../../supabase/seed.sql',
        import.meta.url,
      ),
    );
  });

  it('inserts into fly_shops table', () => {
    assertEquals(seed.includes('insert into public.fly_shops'), true);
  });

  it('includes all static fly shop slugs', () => {
    for (const shop of FLY_SHOPS) {
      assertEquals(
        seed.includes(`'${shop.id}'`),
        true,
        `Missing shop slug in seed: ${shop.id}`,
      );
    }
  });

  it('uses st_point for geography values', () => {
    assertEquals(seed.includes('st_point('), true);
    assertEquals(seed.includes('::geography'), true);
  });

  it('includes all regions', () => {
    const regions = [
      'catskills',
      'delaware',
      'croton',
      'raritan',
      'connecticut',
      'nc-highcountry',
      'nc-foothills',
    ];
    for (const region of regions) {
      assertEquals(
        seed.includes(`'${region}'`),
        true,
        `Missing region in seed: ${region}`,
      );
    }
  });
});
