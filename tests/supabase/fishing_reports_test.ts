/**
 * Fishing reports schema tests.
 * Validates Zod schemas and migration SQL structure.
 */

import { assertEquals, assertThrows } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import {
  FishingReportSchema,
  ReportSourceSchema,
  ReportSourceTypeSchema,
} from '../../src/models/types.ts';

// ============================================================================
// ReportSourceType Schema
// ============================================================================

describe('ReportSourceTypeSchema', () => {
  it('accepts valid source types', () => {
    assertEquals(ReportSourceTypeSchema.parse('rss'), 'rss');
    assertEquals(ReportSourceTypeSchema.parse('scrape'), 'scrape');
    assertEquals(ReportSourceTypeSchema.parse('api'), 'api');
    assertEquals(ReportSourceTypeSchema.parse('manual'), 'manual');
  });

  it('rejects invalid source type', () => {
    assertThrows(() => ReportSourceTypeSchema.parse('email'));
    assertThrows(() => ReportSourceTypeSchema.parse(''));
  });
});

// ============================================================================
// ReportSource Schema
// ============================================================================

describe('ReportSourceSchema', () => {
  const validSource = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Beaverkill Angler Reports',
    type: 'rss' as const,
    url: 'https://beaverkillangler.com/feed',
    scrapeConfig: { selector: '.report-content' },
    lastFetchedAt: '2024-04-15T14:00:00Z',
    fetchFrequencyMinutes: 60,
    active: true,
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-04-15T14:00:00Z',
  };

  it('accepts valid report source', () => {
    const result = ReportSourceSchema.parse(validSource);
    assertEquals(result.name, 'Beaverkill Angler Reports');
    assertEquals(result.type, 'rss');
    assertEquals(result.fetchFrequencyMinutes, 60);
  });

  it('accepts null url and lastFetchedAt', () => {
    const result = ReportSourceSchema.parse({
      ...validSource,
      url: null,
      lastFetchedAt: null,
    });
    assertEquals(result.url, null);
    assertEquals(result.lastFetchedAt, null);
  });

  it('accepts omitted scrapeConfig', () => {
    const { scrapeConfig: _, ...withoutConfig } = validSource;
    const result = ReportSourceSchema.parse(withoutConfig);
    assertEquals(result.scrapeConfig, undefined);
  });

  it('rejects invalid uuid', () => {
    assertThrows(() =>
      ReportSourceSchema.parse({
        ...validSource,
        id: 'not-a-uuid',
      })
    );
  });

  it('rejects non-positive fetchFrequencyMinutes', () => {
    assertThrows(() =>
      ReportSourceSchema.parse({
        ...validSource,
        fetchFrequencyMinutes: 0,
      })
    );
    assertThrows(() =>
      ReportSourceSchema.parse({
        ...validSource,
        fetchFrequencyMinutes: -10,
      })
    );
  });

  it('rejects invalid type', () => {
    assertThrows(() =>
      ReportSourceSchema.parse({
        ...validSource,
        type: 'webhook',
      })
    );
  });
});

// ============================================================================
// FishingReport Schema
// ============================================================================

describe('FishingReportSchema', () => {
  const validReport = {
    id: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    streamId: 'beaverkill',
    sourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    sourceUrl: 'https://example.com/report/123',
    reportDate: '2024-04-15',
    rawText: 'Good fishing on the Beaverkill today. Hendricksons hatching around 2pm.',
    extractedConditions: { quality: 'good', clarity: 'clear' },
    extractedFlies: ['Hendrickson #14', 'Elk Hair Caddis #16'],
    waterTempMentioned: 54.5,
    flowMentioned: 200,
    confidenceScore: 0.85,
    createdAt: '2024-04-15T18:00:00Z',
    updatedAt: '2024-04-15T18:00:00Z',
  };

  it('accepts valid fishing report', () => {
    const result = FishingReportSchema.parse(validReport);
    assertEquals(result.streamId, 'beaverkill');
    assertEquals(result.reportDate, '2024-04-15');
    assertEquals(result.confidenceScore, 0.85);
  });

  it('accepts null nullable fields', () => {
    const result = FishingReportSchema.parse({
      ...validReport,
      sourceId: null,
      sourceUrl: null,
      waterTempMentioned: null,
      flowMentioned: null,
      confidenceScore: null,
    });
    assertEquals(result.sourceId, null);
    assertEquals(result.waterTempMentioned, null);
    assertEquals(result.confidenceScore, null);
  });

  it('accepts omitted optional fields', () => {
    const { extractedConditions: _, extractedFlies: __, ...minimal } = validReport;
    const result = FishingReportSchema.parse(minimal);
    assertEquals(result.extractedConditions, undefined);
    assertEquals(result.extractedFlies, undefined);
  });

  it('rejects confidence score above 1', () => {
    assertThrows(() =>
      FishingReportSchema.parse({
        ...validReport,
        confidenceScore: 1.5,
      })
    );
  });

  it('rejects confidence score below 0', () => {
    assertThrows(() =>
      FishingReportSchema.parse({
        ...validReport,
        confidenceScore: -0.1,
      })
    );
  });

  it('accepts boundary confidence scores', () => {
    const zero = FishingReportSchema.parse({ ...validReport, confidenceScore: 0 });
    assertEquals(zero.confidenceScore, 0);

    const one = FishingReportSchema.parse({ ...validReport, confidenceScore: 1 });
    assertEquals(one.confidenceScore, 1);
  });

  it('rejects invalid uuid for id', () => {
    assertThrows(() =>
      FishingReportSchema.parse({
        ...validReport,
        id: 'not-valid',
      })
    );
  });

  it('rejects missing rawText', () => {
    const { rawText: _, ...noRawText } = validReport;
    assertThrows(() => FishingReportSchema.parse(noRawText));
  });
});

// ============================================================================
// Migration SQL Structure
// ============================================================================

describe('fishing reports migration SQL', () => {
  let sql: string;

  it('reads migration file', async () => {
    sql = await Deno.readTextFile(
      new URL(
        '../../supabase/migrations/00008_fishing_reports.sql',
        import.meta.url,
      ),
    );
  });

  it('creates report_sources table', () => {
    assertEquals(sql.includes('create table public.report_sources'), true);
  });

  it('creates fishing_reports table', () => {
    assertEquals(sql.includes('create table public.fishing_reports'), true);
  });

  it('includes FK from fishing_reports to report_sources', () => {
    assertEquals(
      sql.includes('references public.report_sources(id) on delete set null'),
      true,
    );
  });

  it('enables RLS on both tables', () => {
    assertEquals(
      sql.includes('alter table public.report_sources enable row level security'),
      true,
    );
    assertEquals(
      sql.includes('alter table public.fishing_reports enable row level security'),
      true,
    );
  });

  it('creates indexes on fishing_reports', () => {
    assertEquals(sql.includes('idx_fishing_reports_stream_id'), true);
    assertEquals(sql.includes('idx_fishing_reports_report_date'), true);
    assertEquals(sql.includes('idx_fishing_reports_source_id'), true);
  });

  it('uses existing update_updated_at trigger function', () => {
    assertEquals(sql.includes('execute function public.update_updated_at()'), true);
    // Should NOT define set_updated_at (that does not exist in earlier migrations)
    assertEquals(sql.includes('create or replace function'), false);
  });

  it('includes confidence_score check constraint', () => {
    assertEquals(
      sql.includes('confidence_score >= 0 and confidence_score <= 1'),
      true,
    );
  });

  it('includes type check constraint on report_sources', () => {
    assertEquals(
      sql.includes("type in ('rss', 'scrape', 'api', 'manual')"),
      true,
    );
  });
});
