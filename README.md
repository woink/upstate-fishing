# Upstate Fishing

Real-time fishing conditions for NY/NJ/CT trout streams — combines USGS water data, weather forecasts, and insect hatch predictions.

## Tech Stack

Deno · TypeScript · Hono (backend) · Fresh + Preact + Tailwind (frontend) · Zod · Leaflet

## Quick Start

```bash
# Backend (port 8000)
deno task dev

# Frontend (port 8001)
cd frontend && deno task dev
```

## Data Sources

- **USGS Water Data API** — real-time water temp, flow, gage height
- **Weather.gov API** — air temp, cloud cover, precipitation
- **Hatch data** — curated temperature/season thresholds for 18+ insect species
