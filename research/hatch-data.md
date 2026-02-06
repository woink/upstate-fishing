# Hatch Data Research

## Temperature Thresholds for Insect Emergence

Based on Colorado/Rocky Mountain data (adjust for Northeast):

| Insect | Temp Trigger (°F) | Notes |
|--------|-------------------|-------|
| Midges | 38-42+ | Year-round, any temp above freezing |
| Blue Winged Olives (BWO) | 46-56 | Spring & fall, triggered by overcast/drizzle |
| Caddis | 56+ | First significant emergence |
| Salmon Flies | 55-57 | Sustained temp + time of year (late May-June) |
| Golden Stones | 57+ | Shortly after Salmon Flies |
| Yellow Sallies | 57-60 | Overlaps with Goldens, lasts into summer |
| Green Drakes | 58+ | Very time-of-day dependent |
| Pale Morning Duns (PMD) | 60+ | Peak in July |

**Key insight:** Once a river "runs through" a temp threshold, the hatch moves on — except for Midges and BWOs which recur as temps drop in fall.

## Catskills-Specific Hatches

Major rivers: Beaverkill, Willowemoc, Neversink, Esopus, Upper Delaware (West Branch, East Branch)

### Hendrickson (Ephemerella subvaria)
- **When:** April through end of May
- **Size:** #12-14
- **Notes:** Official start of dry fly season. Males ("Red Quills") are darker reds/pinks. Females ("Light Hendricksons") are smaller, tan/yellow. Need multiple color variations.

### March Brown (Maccaffertium vicarium)
- **When:** May (not March!)
- **Size:** #10-14 (larger)
- **Notes:** Not a blanket hatch — steady trickle throughout day. Good for blind casting big dries.

### Sulphurs (various species)
- **Big Sulphurs:** #14-16, tail end of Hendrickson hatch
- **Little Summer Sulphurs:** #16-20, West Branch, dog days of summer
- **Notes:** Technically difficult — 6X/7X tippets, fish are spooky

### Blue Winged Olives
- **When:** Early spring (as water warms from 40s-50s) and fall (as water drops from 60s back to 50s)
- **Trigger:** Overcast, drizzly conditions

## Catskills Fly Shop Data Sources

### Active Fishing Reports
- **Beaverkill Angler:** https://beaverkillangler.com/fishingreport.html
  - Covers: Beaverkill, Willowemoc, East Branch Delaware, West Branch Delaware
  - Manual updates, could scrape

### Hatch Charts
- **Catskill Fly Fishing Museum:** Sells physical chart for Beaverkill/Willowemoc/Delaware systems
- **NY DEC PDF:** https://extapps.dec.ny.gov/docs/fish_marine_pdf/ffthecatskills.pdf

## Building a Prediction Model

### Required Inputs
1. **Water temperature** (USGS real-time)
2. **Air temperature forecast** (weather.gov API)
3. **Time of year** (date)
4. **Cloud cover** (weather forecast)
5. **Precipitation** (forecast)

### Simple Algorithm Draft
```
if water_temp >= 46 and water_temp <= 56:
    if is_overcast or precipitation > 0:
        likely_hatch.append("BWO")
        
if water_temp >= 56:
    if month in [4, 5] and not post_runoff:
        likely_hatch.append("Hendrickson")
    likely_hatch.append("Caddis")
    
if water_temp >= 58:
    if month in [5, 6]:
        likely_hatch.append("March Brown")
        likely_hatch.append("Green Drake")
        
if water_temp >= 60:
    if month in [6, 7, 8]:
        likely_hatch.append("Sulphurs")
        likely_hatch.append("PMD")
```

### Calibration Needed
- Northeast temps differ from Rocky Mountain thresholds
- Need to correlate USGS historical data with known hatch records
- Altitude/latitude adjustments
