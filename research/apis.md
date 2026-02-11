# API Documentation

## USGS Water Data API

**Base URL:** https://api.waterdata.usgs.gov/

### Endpoints

#### Real-time Observations

```
GET /observations
```

Parameters for NY streams:

- State code: NY
- Site type: ST (stream)
- Parameters: 00010 (water temp), 00060 (discharge/flow), 00065 (gage height)

#### Daily Historical Data

```
GET /daily-data
```

Get mean/median/max/min over time periods.

#### Monitoring Locations

```
GET /monitoring-locations
```

Returns lat/lon, site name, HUC code, date established.

### Example Queries

Get all NY stream sites with water temp:

```
https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=NY&siteType=ST&parameterCd=00010
```

Get specific site data:

```
https://waterservices.usgs.gov/nwis/iv/?format=json&sites=01417500&parameterCd=00010,00060
```

(01417500 = East Branch Delaware at Margaretville)

### Key NY Stations (Catskills)

| Station ID | Name                                  | River      |
| ---------- | ------------------------------------- | ---------- |
| 01417500   | East Branch Delaware at Margaretville | Delaware   |
| 01420500   | Beaver Kill at Cooks Falls            | Beaverkill |
| 01421000   | East Branch Delaware at Fishs Eddy    | Delaware   |
| 01423000   | West Branch Delaware at Walton        | Delaware   |
| 01426500   | West Branch Delaware at Hale Eddy     | Delaware   |

**TODO:** Map all relevant stations for upstate NY fishing.

---

## Weather.gov API (NWS)

**Base URL:** https://api.weather.gov/

### How to Get Forecast

1. Get grid coordinates from lat/lon:

```
GET /points/{lat},{lon}
```

Returns forecast office (e.g., BGM for Binghamton) and grid coordinates.

2. Get forecast:

```
GET /gridpoints/{office}/{gridX},{gridY}/forecast
GET /gridpoints/{office}/{gridX},{gridY}/forecast/hourly
```

### Headers Required

```
User-Agent: YourAppName (contact@email.com)
```

### Response Includes

- Temperature (hourly/period)
- Cloud cover percentage
- Precipitation probability
- Wind speed/direction
- Short/detailed forecast text

### Example Flow

```javascript
// 1. Get grid for Roscoe, NY (Beaverkill area)
// lat: 41.9376, lon: -74.9118
const points = await fetch('https://api.weather.gov/points/41.9376,-74.9118');
// Returns: gridId: "BGM", gridX: 73, gridY: 44

// 2. Get hourly forecast
const forecast = await fetch('https://api.weather.gov/gridpoints/BGM/73,44/forecast/hourly');
```

---

## NY Open Data (Socrata)

**Base URL:** https://data.ny.gov/

### Trout Stocking Dataset

```
GET /resource/d9y2-n436.json
```

Parameters:

- `$where=county='Delaware'`
- `$limit=100`

Returns: waterbody, species, number stocked, town, date range

### Example

```
https://data.ny.gov/resource/d9y2-n436.json?county=Delaware
```

---

## Google Places API (for Fly Shops)

**Base URL:** https://maps.googleapis.com/maps/api/place/

### Nearby Search

```
GET /nearbysearch/json?location={lat},{lon}&radius=50000&keyword=fly+shop&key={API_KEY}
```

### Text Search

```
GET /textsearch/json?query=fly+fishing+shop+catskills+ny&key={API_KEY}
```

**Note:** Requires API key, has usage costs. Alternative: manually curate upstate NY shops.

---

## Potential Data Partners

### Orvis Fishing Reports

- URL: https://fishingreports.orvis.com/
- No public API, would need to scrape or partner

### Hatchpedia

- URL: https://www.hatchpedia.com/
- App with location-based hatch data
- No public API, subscription service

### IdentaFly

- URL: https://my.identafly.app/
- Hatch info and fly patterns
- No public API
