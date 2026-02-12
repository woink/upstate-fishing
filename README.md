# Upstate NY/NJ Fishing Conditions API

**Goal:** Build an app to help Ward know where to fish in upstate NY and NJ, combining stream
conditions, hatch predictions, and local intel.

## Status: MVP Backend Complete ✓

**Last session:** 2026-02-06 **Next up:** Fresh frontend for "where should I fish today?"

## Tech Stack

- **Runtime:** Deno
- **Language:** TypeScript (strict mode)
- **Backend:** Hono
- **Frontend:** Deno Fresh (planned)
- **Validation:** Zod

## Quick Start

```bash
# Install Deno (if needed)
curl -fsSL https://deno.land/install.sh | sh

# Run development server
deno task dev

# Run tests
deno task test

# Type check
deno task check

# Format code
deno task fmt
```

## API Endpoints

| Endpoint                          | Description                                          |
| --------------------------------- | ---------------------------------------------------- |
| `GET /api/streams`                | List all streams (filter by `?region=` or `?state=`) |
| `GET /api/streams/:id`            | Get stream details                                   |
| `GET /api/streams/:id/conditions` | Get current conditions + hatch predictions           |
| `GET /api/hatches`                | List all hatches (filter by `?order=` or `?month=`)  |
| `GET /api/hatches/:id`            | Get hatch details                                    |
| `GET /api/stations/:id`           | Get USGS station readings                            |
| `POST /api/predict`               | Custom hatch prediction                              |

## Covered Waters

### New York

- **Catskills:** Beaverkill, Willowemoc, Esopus, Neversink
- **Delaware:** East Branch, West Branch
- **Croton:** East Branch, West Branch, Middle Branch

### New Jersey

- **Raritan:** South Branch, North Branch, Main Stem
- **Other:** Flat Brook, Pequest River

## Data Sources

### ✅ Confirmed APIs

#### USGS Water Data API

- **URL:** https://api.waterdata.usgs.gov/
- **Cost:** Free
- **Data:** Real-time streamflow, gage height, water temperature, historical stats
- **Coverage:** 208+ monitoring locations in NY
- **Format:** REST API, JSON

Key endpoints:

- `/observations` — real-time measurements
- `/daily-data` — historical daily values
- `/monitoring-locations` — site metadata
- `/time-series-metadata` — thresholds, units, date ranges

#### NY DEC Open Data (Socrata)

- **URL:** https://data.ny.gov
- **Cost:** Free
- **Data:** Trout stocking schedules (brook, brown, rainbow)
- **Coverage:** 2,900+ miles of streams, 309 lakes
- **Format:** Socrata API (JSON/CSV)
- **Dataset:** `d9y2-n436` (Spring Trout Stocking)

Also: DECinfo Locator for wild/stocked stream classifications

### 🔍 Needs More Research

#### Hatch Information

No centralized API exists. Options:

1. Build predictive model from water temp + time of year + region
2. Scrape regional fly shop reports
3. Static hatch chart data per watershed
4. Partner with local shops

#### Fly Shop Directory

No API. Options:

- Google Places API
- Yelp Fusion API
- Manual curation (finite number in upstate NY)

#### Weather Data

Needed for hatch prediction. Options:

- OpenWeatherMap
- Weather.gov API (free, official)
- Tomorrow.io

## Research Tasks

- [x] Research hatch prediction models (temp thresholds by insect)
- [x] Evaluate weather APIs for temp forecasting
- [ ] Map USGS stations to upstate NY watersheds
- [ ] Test USGS API with sample queries
- [ ] Catalog upstate NY fly shops
- [ ] Look into existing fishing apps (competition research)
- [ ] Build prototype hatch prediction algorithm

## Key Insight: Hatch Prediction is Buildable

No API exists for hatch data, but we can BUILD a prediction model from:

1. **USGS water temp** (real-time)
2. **Weather.gov forecast** (air temp, cloud cover, precip)
3. **Time of year**
4. **Known temp thresholds** for each insect species

See `research/hatch-data.md` for threshold data.

## Architecture Ideas

### v1 MVP

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ USGS API    │────▶│              │     │                 │
│ (water temp)│     │  Prediction  │────▶│  "Fish here     │
└─────────────┘     │    Engine    │     │   today"        │
                    │              │     │                 │
┌─────────────┐     │              │     │  - Location     │
│ Weather.gov │────▶│              │     │  - Likely hatch │
│ (forecast)  │     │              │     │  - Fly patterns │
└─────────────┘     └──────────────┘     └─────────────────┘
                           ▲
                    ┌──────┴───────┐
                    │ Hatch Rules  │
                    │ (temp + date │
                    │  thresholds) │
                    └──────────────┘
```

### Tech Stack Options

- **Backend:** Deno/TypeScript (familiar), or Rust (learning)
- **Data:** SQLite for caching, JSON for hatch rules
- **Frontend:** Simple web app or CLI first

## Files

- `research/hatch-data.md` — Temperature thresholds, Catskills hatches
- `research/apis.md` — API documentation and examples

# CI test 1770802087

<!-- Deployed via CI: 2026-02-12T04:13:57Z -->
