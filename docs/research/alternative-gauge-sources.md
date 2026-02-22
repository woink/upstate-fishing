# Alternative Gauge Sources Research

Analysis of alternative water monitoring sources beyond USGS to fill temperature data gaps.

## Temperature Data Gap Analysis

The following streams in the app currently lack USGS water temperature data (parameter 00010). The
prediction service falls back to month-based predictions for these streams, reducing hatch
prediction accuracy.

### Streams Missing Water Temperature

| Stream               | Region          | State | Stations | Has Flow | Has Gage | Temp Gap         |
| -------------------- | --------------- | ----- | -------- | -------- | -------- | ---------------- |
| East Branch Croton   | Croton          | NY    | 3        | Yes      | Yes      | **All stations** |
| West Branch Croton   | Croton          | NY    | 3        | Yes      | Yes      | **All stations** |
| Middle Branch Croton | Croton          | NY    | 1        | Yes      | No       | **All stations** |
| North Branch Raritan | Raritan         | NJ    | 1        | Yes      | Yes      | **All stations** |
| Shetucket River      | Connecticut     | CT    | 2        | Yes      | Yes      | **All stations** |
| Watauga River        | NC High Country | NC    | 1        | Yes      | Yes      | **All stations** |
| South Fork New River | NC High Country | NC    | 1        | Yes      | Yes      | **All stations** |
| Elk Creek            | NC High Country | NC    | 1        | Yes      | Yes      | **All stations** |
| Linville River       | NC Foothills    | NC    | 1        | Yes      | Yes      | **All stations** |
| Wilson Creek         | NC Foothills    | NC    | 1        | Yes      | No       | **All stations** |
| Johns River          | NC Foothills    | NC    | 1        | Yes      | Yes      | **All stations** |
| South Fork Catawba   | NC Foothills    | NC    | 1        | Yes      | Yes      | **All stations** |
| South Toe River      | NC Foothills    | NC    | 1        | Yes      | Yes      | **All stations** |

### Streams With Partial Temperature Coverage

| Stream               | Region | Stations w/ Temp        | Stations w/o Temp  |
| -------------------- | ------ | ----------------------- | ------------------ |
| Farmington River     | CT     | 01186000 (Riverton)     | 01188090, 01189995 |
| Housatonic River     | CT     | 01200600 (New Milford)  | 01199000, 01200500 |
| Naugatuck River      | CT     | 01208500 (Beacon Falls) | 01206900           |
| South Branch Raritan | NJ     | 01396500 (High Bridge)  | 01398102           |

### Summary by Region

| Region          | Total Streams | Full Temp | Partial Temp | No Temp | Impact   |
| --------------- | ------------- | --------- | ------------ | ------- | -------- |
| Catskills       | 4             | 4         | 0            | 0       | None     |
| Delaware        | 2             | 2         | 0            | 0       | None     |
| Croton          | 3             | 0         | 0            | **3**   | Severe   |
| Raritan         | 5             | 3         | 1            | **1**   | Moderate |
| Connecticut     | 4             | 0         | 3            | **1**   | Moderate |
| NC High Country | 3             | 0         | 0            | **3**   | Severe   |
| NC Foothills    | 6             | 1         | 0            | **5**   | Severe   |

**Highest priority regions**: Croton (all 3 streams), NC Foothills (5 of 6), NC High Country (all
3).

## Alternative Monitoring Sources

### 1. USGS Water Quality Portal (WQP)

- **URL**: waterqualitydata.us
- **API**: REST API with JSON/CSV output
- **Coverage**: Aggregates USGS, EPA, USDA, state agency data
- **Temp data**: Yes -- discrete water quality samples include temperature
- **Frequency**: Variable -- some sites have daily, others monthly/quarterly
- **Access**: Free, public, no API key required
- **Limitations**: Data may be days to weeks old (lab results vs real-time)
- **Priority**: **High** -- may fill gaps where continuous monitoring is absent

### 2. NY DEC Stream Monitoring (Croton Watershed)

- **URL**: dec.ny.gov/lands/watqual.html
- **Coverage**: NYC watershed streams including Croton system
- **Temp data**: Yes -- routine water quality monitoring
- **Frequency**: Monthly to quarterly field sampling
- **Access**: Data available through NY Open Data portal and WQP
- **Limitations**: Low frequency, not real-time
- **Priority**: **High** -- only potential source for Croton temperature

### 3. NC DEQ Ambient Monitoring System (AMS)

- **URL**: deq.nc.gov/about/divisions/water-resources/water-resources-data/water-sciences-data
- **Coverage**: NC streams including High Country and Foothills waters
- **Temp data**: Yes -- continuous and discrete monitoring
- **Frequency**: Monthly field visits; some sites have continuous loggers
- **Access**: Available through NC DEQ data portal and WQP
- **Limitations**: Real-time access may require direct agency contact
- **Priority**: **High** -- covers all NC temp gap streams

### 4. CT DEEP Water Quality Monitoring

- **URL**: portal.ct.gov/deep/water/water-quality/water-quality-monitoring-program
- **Coverage**: Major CT waterways including Shetucket
- **Temp data**: Yes -- discrete and continuous
- **Frequency**: Monthly to seasonal
- **Access**: CT Open Data portal, WQP
- **Limitations**: Shetucket coverage uncertain
- **Priority**: **Medium** -- CT already has partial USGS temp on most streams

### 5. OneRain Contrail

- **URL**: onerain.com/contrail
- **Coverage**: Private sensor networks for flood/weather monitoring
- **Temp data**: Some sensors include water temp
- **Frequency**: Real-time (5-15 min intervals)
- **Access**: Varies by network -- some public, some require agreements
- **Limitations**: Coverage is flood-focused, not fisheries-focused
- **Priority**: **Low** -- uncertain coverage for our specific streams

### 6. Watershed Associations / Volunteer Monitoring

- **NYC Watershed** (covers Croton): watershedassessmentassociates.com
  - Citizen science water quality data
  - Seasonal sampling campaigns
- **Catskill Watershed Corporation**: cwconline.org
  - Watershed stewardship programs
- **Watauga Riverkeeper**: wataugariver.org
  - Water quality monitoring on Watauga River
- **Temp data**: Yes, but sporadic and volunteer-dependent
- **Access**: Usually available on request or through WQP
- **Priority**: **Medium** -- useful as supplementary data source

### 7. NOAA National Water Model (NWM)

- **URL**: water.noaa.gov/about/nwm
- **Coverage**: Continental US stream network (2.7M reaches)
- **Temp data**: Modeled stream temperature (not direct measurement)
- **Frequency**: Hourly forecasts, analysis, short/medium range
- **Access**: Free via NOAA Open Data dissemination
- **Limitations**: Modeled data, not measured -- accuracy varies by location
- **Priority**: **Medium** -- useful fallback when no monitoring exists

## Recommended Approach

### Phase 1: USGS Water Quality Portal Integration

The WQP aggregates data from USGS, EPA, and state agencies through a single API. This is the
highest-ROI integration since it can potentially fill gaps across all regions with one API client.

```
GET https://www.waterqualitydata.us/data/Result/search
  ?statecode=US:36        # NY
  &characteristicName=Temperature, water
  &startDateLo=2024-01-01
  &mimeType=json
```

Implementation:

1. Query WQP for temperature data near our gap streams
2. Match by location proximity (lat/lon within ~1km of USGS station)
3. Cache with longer TTL (24hr) since WQP data is not real-time
4. Use as fallback when USGS temp is `not_equipped`

### Phase 2: State Agency Direct APIs

For regions where WQP data is insufficient:

- NC DEQ direct data portal for NC streams
- NY DEC data for Croton watershed
- CT DEEP for Shetucket if needed

### Phase 3: NOAA NWM Modeled Temperature

Use modeled stream temperature as a last-resort fallback:

- Available for all streams regardless of monitoring
- Lower accuracy but better than month-only predictions
- Mark as "modeled" in the UI for transparency

## API Documentation Summary

| Source   | API Type        | Auth | Rate Limits      | Docs                                          |
| -------- | --------------- | ---- | ---------------- | --------------------------------------------- |
| USGS IV  | REST (JSON)     | None | 100 req/min      | waterservices.usgs.gov                        |
| WQP      | REST (JSON/CSV) | None | Moderate         | waterqualitydata.us/webservices_documentation |
| NOAA NWM | S3/OPeNDAP      | None | None (bulk data) | water.noaa.gov/about/nwm                      |
| NC DEQ   | Web portal      | None | Manual download  | deq.nc.gov                                    |
| NY DEC   | Open Data       | None | Standard         | data.ny.gov                                   |
| CT DEEP  | Open Data       | None | Standard         | data.ct.gov                                   |
