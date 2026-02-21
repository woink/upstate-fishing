# Fishing Report Sources Research

Regional fishing report sources for automated ingestion into the fishing reports system.

## Source Inventory

| #  | Name                            | URL                                                            | Type       | Format                   | Frequency          | Regions Covered                    | Priority |
| -- | ------------------------------- | -------------------------------------------------------------- | ---------- | ------------------------ | ------------------ | ---------------------------------- | -------- |
| 1  | NY DEC Fishing Reports          | dec.ny.gov/fishing/9922.html                                   | Web        | HTML (structured tables) | Weekly (Apr-Oct)   | Catskills, Delaware, Croton        | High     |
| 2  | NJ DEP Fishing Reports          | nj.gov/dep/fgw/fishingreport.htm                               | Web        | HTML                     | Weekly             | Raritan, NJ trout waters           | High     |
| 3  | CT DEEP Fishing Reports         | portal.ct.gov/deep/fishing/general-information/fishing-reports | Web        | HTML                     | Weekly             | Connecticut                        | High     |
| 4  | NC WRC Trout Forecast           | ncwildlife.org/fishing/trout-fishing                           | Web        | HTML                     | Seasonal           | NC High Country, NC Foothills      | High     |
| 5  | Beaverkill Angler Blog          | beaverkillangler.com/blog                                      | RSS/Scrape | HTML blog posts          | 2-3x/week (season) | Catskills (Beaverkill, Willowemoc) | High     |
| 6  | UpCountry Sportfishing Reports  | farmingtonriver.com/fishing-report                             | Scrape     | HTML                     | Daily (season)     | Connecticut (Farmington)           | High     |
| 7  | Housatonic River Outfitters     | dryflies.com/fishing-report                                    | Scrape     | HTML                     | 2-3x/week          | Connecticut (Housatonic TMA)       | Medium   |
| 8  | Catskill Outfitters Reports     | catskilloutfitters.com/fishing-reports                         | Scrape     | HTML                     | Weekly             | Catskills (Esopus)                 | Medium   |
| 9  | Baxter House Reports            | baxterhouse.net/fishing-reports                                | Scrape     | HTML blog                | 2-3x/week          | Catskills, Delaware                | Medium   |
| 10 | Foscoe Fishing Reports          | foscoefishing.com/fishing-report                               | Scrape     | HTML                     | Weekly             | NC High Country                    | Medium   |
| 11 | Hunter Banks Reports            | hunterbanks.com/fishing-report                                 | Scrape     | HTML                     | Weekly             | NC Foothills                       | Medium   |
| 12 | West Branch Angler Reports      | westbranchresort.com/fishing-report                            | Scrape     | HTML                     | 2-3x/week          | Delaware (West Branch)             | Medium   |
| 13 | Delaware River Club (Al Caucci) | mayfly.com                                                     | Scrape     | HTML                     | Seasonal           | Delaware (Upper)                   | Low      |
| 14 | NYS Trout Unlimited Reports     | tu.org/conservation/new-york                                   | Scrape     | HTML/PDF                 | Monthly            | Catskills, statewide               | Low      |
| 15 | Shannon's Fly & Tackle          | shannonsflyandtackle.com                                       | Scrape     | HTML/Social              | Weekly             | Raritan (S Branch, Musconetcong)   | Low      |

## Classification

### Structured Sources

State agency reports (NY DEC, NJ DEP, CT DEEP, NC WRC) tend to have the most consistent formatting:

- Tables with stream name, conditions, stocking dates
- Machine-parseable with CSS selectors or regex
- Seasonal (typically April through October)
- Official data, high reliability

### Semi-Structured Sources

Fly shop reports follow predictable patterns but vary in format:

- Blog-style posts with consistent headings
- Usually mention: water temperature, flow conditions, hatches, flies that worked
- Frequency varies by season and shop activity
- Rich anecdotal data (fly patterns, time of day, specific runs)

### Unstructured Sources

Social media and forums require NLP or LLM extraction:

- Reddit (r/flyfishing, r/troutfishing) -- keyword + location filtering
- Facebook groups (Catskill Fly Fishing, NJ Fly Fishing)
- Low signal-to-noise ratio, but sometimes the most current reports

## Implementation Priority

### Phase 1: State Agency Reports (Weeks 1-2)

1. **NY DEC** -- Structured HTML, covers highest-priority Catskills/Delaware streams
2. **NJ DEP** -- Similar format, covers Raritan system
3. **CT DEEP** -- Covers Farmington, Housatonic, Naugatuck

These provide the foundation: consistent format, official data, weekly cadence.

### Phase 2: Fly Shop RSS/Blog (Weeks 3-4)

4. **Beaverkill Angler** -- Most active reporter for Catskills
5. **UpCountry Sportfishing** -- Daily Farmington reports
6. **Housatonic River Outfitters** -- Housatonic TMA specialist

These add granularity: daily conditions, specific fly recommendations, water temps.

### Phase 3: Remaining Shops + NC (Weeks 5-6)

7-11. Remaining fly shops by region coverage priority

### Phase 4: NLP/LLM Extraction (Future)

- Reddit, Facebook, forum scraping with LLM-based entity extraction
- Requires confidence scoring and human review workflow

## Technical Approach

### RSS Sources

- Standard RSS/Atom parsing with `DOMParser` or `xml2js`
- Schedule: match source's publish frequency
- Store raw XML + extracted text

### Web Scraping

- Use CSS selectors to extract report content from known page structures
- `scrape_config` in `report_sources` table stores per-source selectors
- Rotate user agents, respect robots.txt and rate limits
- Handle seasonal page structure changes (shops often redesign)

### Data Extraction Pipeline

1. Fetch raw HTML/RSS
2. Extract report text using configured selectors
3. Parse structured fields: water temp, flow, date
4. Use regex/NLP for fly pattern extraction
5. Score confidence based on extraction completeness
6. Store in `fishing_reports` with `extracted_conditions` and `extracted_flies`

## Legal Considerations

- **State agency data**: Public domain, no restrictions
- **Fly shop blogs**: Generally acceptable for personal/non-commercial scraping
  - Respect `robots.txt` directives
  - Rate-limit requests (minimum 10s between requests per domain)
  - Cache aggressively to minimize requests
  - Consider reaching out for explicit permission or RSS feed access
  - Attribution in the app (link back to source)
- **Social media**: Platform ToS typically prohibit scraping
  - Reddit API has rate limits and requires app registration
  - Facebook scraping violates ToS -- avoid
  - Consider official API access where available

## Gap Analysis

| Region          | State Reports | Fly Shop Reports | Coverage  |
| --------------- | ------------- | ---------------- | --------- |
| Catskills       | NY DEC        | 3 shops          | Excellent |
| Delaware        | NY DEC        | 3 shops          | Excellent |
| Croton          | NY DEC        | 1 shop           | Fair      |
| Raritan         | NJ DEP        | 2 shops          | Good      |
| Connecticut     | CT DEEP       | 2 shops          | Good      |
| NC High Country | NC WRC        | 2 shops          | Good      |
| NC Foothills    | NC WRC        | 2 shops          | Good      |

The Croton region has the weakest report coverage. River Bay Outfitters is the sole shop source, and
NY DEC reports may not cover the smaller Croton tributaries in detail.
