-- ============================================================================
-- Fishing Reports Schema
-- Report sources (RSS feeds, scraped sites, APIs) and extracted fishing reports.
-- ============================================================================

-- Report sources: where fishing reports come from
create table public.report_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('rss', 'scrape', 'api', 'manual')),
  url text,
  scrape_config jsonb default '{}',
  last_fetched_at timestamptz,
  fetch_frequency_minutes integer not null default 60,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fishing reports: extracted from sources
create table public.fishing_reports (
  id uuid primary key default gen_random_uuid(),
  stream_id text not null,
  source_id uuid references public.report_sources(id) on delete set null,
  source_url text,
  report_date date not null,
  raw_text text not null,
  extracted_conditions jsonb default '{}',
  extracted_flies jsonb default '[]',
  water_temp_mentioned numeric,
  flow_mentioned numeric,
  confidence_score numeric check (confidence_score >= 0 and confidence_score <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_fishing_reports_stream_id on public.fishing_reports(stream_id);
create index idx_fishing_reports_report_date on public.fishing_reports(report_date desc);
create index idx_fishing_reports_source_id on public.fishing_reports(source_id);

-- RLS
alter table public.report_sources enable row level security;
alter table public.fishing_reports enable row level security;

create policy "Public read access" on public.report_sources for select using (true);
create policy "Service role write" on public.report_sources for all
  using (auth.role() = 'service_role');

create policy "Public read access" on public.fishing_reports for select using (true);
create policy "Service role write" on public.fishing_reports for all
  using (auth.role() = 'service_role');

-- Updated_at triggers (reuses update_updated_at() from 00001_create_initial_schema.sql)
create trigger report_sources_updated_at before update on public.report_sources
  for each row execute function public.update_updated_at();
create trigger fishing_reports_updated_at before update on public.fishing_reports
  for each row execute function public.update_updated_at();
