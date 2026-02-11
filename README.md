# Upstate NY/NJ Fishing Conditions App

**Goal:** Help Ward know where to fish in upstate NY and NJ, combining stream conditions, hatch
predictions, and local intel.

## Status: MVP Frontend In Progress 🚧

**Backend:** Complete ✓ **Frontend:** Deno Fresh scaffold ready

## Tech Stack

- **Runtime:** Deno
- **Language:** TypeScript (strict mode)
- **Backend:** Hono
- **Frontend:** Deno Fresh + Tailwind + Leaflet
- **Validation:** Zod

## Quick Start

```bash
# Install Deno (if needed)
curl -fsSL https://deno.land/install.sh | sh

# Run backend (port 8000)
deno task dev

# Run frontend (port 8001, in another terminal)
cd frontend && deno task dev
```

## Project Structure

```
upstate-fishing-backend/
├── src/                    # Backend source
│   ├── data/              # Static data (streams, hatches)
│   ├── models/            # TypeScript types + Zod schemas
│   ├── routes/            # Hono API routes
│   ├── services/          # External API integrations
│   ├── main.ts            # Server entry point
│   └── mod.ts             # Module exports
├── frontend/              # Deno Fresh app
│   ├── routes/            # Page routes
│   ├── islands/           # Interactive components
│   ├── static/            # CSS, assets
│   └── deno.json          # Frontend config
├── tests/                 # Test files
└── deno.json              # Root config
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

## Frontend Pages

| Route          | Description                        |
| -------------- | ---------------------------------- |
| `/`            | Today's top picks + quick links    |
| `/streams`     | Browse all streams with conditions |
| `/streams/:id` | Stream detail with full conditions |
| `/map`         | Interactive map with USGS sensors  |

## Covered Waters

### New York

- **Catskills:** Beaverkill, Willowemoc, Esopus, Neversink
- **Delaware:** East Branch, West Branch
- **Croton:** East Branch, West Branch, Middle Branch

### New Jersey

- **Raritan:** South Branch, North Branch, Main Stem
- **Other:** Flat Brook, Pequest River

## Data Sources

- **USGS Water Data API** - Real-time water temp, flow, gage height
- **Weather.gov API** - Air temp, cloud cover, precipitation
- **Hatch Data** - Curated temperature thresholds for 18+ insect species

## Development

```bash
# Type check
deno task check

# Run tests
deno task test

# Format code
deno task fmt

# Lint
deno task lint
```

## Environment Variables

```bash
# Frontend
API_URL=http://localhost:8000   # Backend URL
```
