/**
 * Stream and station configuration for NY/NJ fishing waters
 *
 * Station data verified against USGS Instantaneous Values API (2026-02-12).
 * Parameter coverage per station documented inline.
 *
 * USGS Parameters:
 *   00010 = Water temperature (°F)
 *   00060 = Discharge/flow (cfs)
 *   00065 = Gage height (ft)
 */

import type { Stream } from '../models/types.ts';
import { RegionSchema, StateSchema } from '../models/types.ts';

/**
 * Curated list of trout streams with their USGS monitoring stations
 */
export const STREAMS: readonly Stream[] = [
  // ============================================================================
  // Catskills Region - NY
  // ============================================================================
  {
    id: 'beaverkill',
    name: 'Beaverkill',
    region: 'catskills',
    state: 'NY',
    // 01420500: temp ✅ flow ✅ gage ✅
    // Note: 01418500, 01418000 removed — no longer reporting data
    stationIds: ['01420500'],
    coordinates: { latitude: 41.9365, longitude: -74.9201 },
  },
  {
    id: 'willowemoc',
    name: 'Willowemoc Creek',
    region: 'catskills',
    state: 'NY',
    // 01419500: temp ✅ flow ✅ gage ✅
    stationIds: ['01419500'],
    coordinates: { latitude: 41.9001, longitude: -74.8254 },
  },
  {
    id: 'esopus',
    name: 'Esopus Creek',
    region: 'catskills',
    state: 'NY',
    // 01362200 (Allaben): temp ✅ flow ✅ gage ✅
    // 01362500 (Coldbrook): temp ✅ flow ✅ gage ✅
    // 01364500 (Mt Marion): temp ✅ flow ✅ gage ✅
    stationIds: ['01362200', '01362500', '01364500'],
    coordinates: { latitude: 42.0459, longitude: -74.2768 },
  },
  {
    id: 'neversink',
    name: 'Neversink River',
    region: 'catskills',
    state: 'NY',
    // 01434017 (E Branch Claryville): temp ✅ flow ✅ gage ✅
    // 01434021 (W Branch Winnisook): temp ✅ flow ✅ gage ✅
    // 01434498 (W Branch Claryville): temp ✅ flow ✅ gage ✅
    stationIds: ['01434017', '01434021', '01434498'],
    coordinates: { latitude: 41.8601, longitude: -74.5854 },
  },

  // ============================================================================
  // Delaware System - NY
  // ============================================================================
  {
    id: 'east-branch-delaware',
    name: 'East Branch Delaware River',
    region: 'delaware',
    state: 'NY',
    // 01413500 (Margaretville): temp ✅ flow ✅ gage ✅
    // 01417000 (Downsville): temp ✅ flow ✅ gage ✅
    // 01417500 (Harvard): temp ✅ flow ✅ gage ✅
    // 01421000 (Fishs Eddy): temp ✅ flow ✅ gage ✅
    // 01421500 (Hancock): temp ✅ flow ✅ gage ✅
    stationIds: ['01413500', '01417000', '01417500', '01421000', '01421500'],
    coordinates: { latitude: 42.1379, longitude: -74.6574 },
  },
  {
    id: 'west-branch-delaware',
    name: 'West Branch Delaware River',
    region: 'delaware',
    state: 'NY',
    // 01423000 (Walton): temp ✅ flow ✅ gage ✅
    // 01425000 (Stilesville): temp ✅ flow ✅ gage ✅
    // 01426500 (Hale Eddy): temp ✅ flow ✅ gage ✅
    // 01427000 (Hancock): temp ✅ flow ❌ gage ❌ — temp only
    stationIds: ['01423000', '01425000', '01426500', '01427000'],
    coordinates: { latitude: 42.0215, longitude: -75.1154 },
  },

  // ============================================================================
  // Croton System - NY (Westchester/Putnam)
  // ⚠️ No water temperature data available at any Croton station.
  //    Hatch predictions will be limited for this region.
  // ============================================================================
  {
    id: 'east-branch-croton',
    name: 'East Branch Croton River',
    region: 'croton',
    state: 'NY',
    // 0137449480 (Putnam Lake): flow ✅ gage ✅ — NO TEMP
    // 01374505 (Brewster): flow ✅ gage ✅ — NO TEMP
    // 01374531 (Croton Falls): flow ✅ gage ✅ — NO TEMP
    stationIds: ['0137449480', '01374505', '01374531'],
    coordinates: { latitude: 41.3945, longitude: -73.6074 },
  },
  {
    id: 'west-branch-croton',
    name: 'West Branch Croton River',
    region: 'croton',
    state: 'NY',
    // 01374559 (Richardsville): flow ✅ gage ✅ — NO TEMP
    // 01374581 (Kent Cliffs): flow ✅ gage ✅ — NO TEMP
    // 0137462010 (Carmel): flow ✅ gage ✅ — NO TEMP
    stationIds: ['01374559', '01374581', '0137462010'],
    coordinates: { latitude: 41.4704, longitude: -73.7595 },
  },
  {
    id: 'middle-branch-croton',
    name: 'Middle Branch Croton River',
    region: 'croton',
    state: 'NY',
    // 01374654 (Carmel): flow ✅ — NO TEMP, NO GAGE
    stationIds: ['01374654'],
    coordinates: { latitude: 41.4321, longitude: -73.6517 },
  },

  // ============================================================================
  // Raritan System - NJ
  // ============================================================================
  {
    id: 'south-branch-raritan',
    name: 'South Branch Raritan River',
    region: 'raritan',
    state: 'NJ',
    // 01396500 (High Bridge): temp ✅ flow ✅ gage ✅
    // 01398102 (South Branch): gage ✅ — NO TEMP, NO FLOW
    stationIds: ['01396500', '01398102'],
    coordinates: { latitude: 40.6682, longitude: -74.8971 },
  },
  {
    id: 'north-branch-raritan',
    name: 'North Branch Raritan River',
    region: 'raritan',
    state: 'NJ',
    // 01400000 (Raritan): flow ✅ gage ✅ — NO TEMP
    stationIds: ['01400000'],
    coordinates: { latitude: 40.5654, longitude: -74.6354 },
  },
  {
    id: 'raritan-main',
    name: 'Raritan River (Main Stem)',
    region: 'raritan',
    state: 'NJ',
    // 01400500 (Manville): temp ✅ flow ✅ gage ✅
    stationIds: ['01400500'],
    coordinates: { latitude: 40.5401, longitude: -74.5854 },
  },

  // ============================================================================
  // Other NJ Trout Waters
  // ============================================================================
  {
    id: 'flat-brook',
    name: 'Flat Brook',
    region: 'raritan', // Using raritan as catch-all for NJ
    state: 'NJ',
    // 01440000 (Flatbrookville): temp ✅ flow ✅ gage ✅
    stationIds: ['01440000'],
    coordinates: { latitude: 41.1154, longitude: -74.9501 },
  },
  {
    id: 'pequest',
    name: 'Pequest River',
    region: 'raritan',
    state: 'NJ',
    // 01445500 (Pequest): temp ✅ flow ✅ gage ✅
    stationIds: ['01445500'],
    coordinates: { latitude: 40.9254, longitude: -74.9154 },
  },

  // ============================================================================
  // Connecticut Trout Waters
  // ============================================================================
  {
    id: 'farmington',
    name: 'Farmington River',
    region: 'connecticut',
    state: 'CT',
    // 01186000 (W Branch @ Riverton): temp ✅ flow ✅ gage ✅
    // 01188090 (Unionville): flow ✅ gage ✅ — NO TEMP
    // 01189995 (Tariffville): flow ✅ gage ✅ — NO TEMP
    stationIds: ['01186000', '01188090', '01189995'],
    coordinates: { latitude: 41.9628, longitude: -73.0176 },
  },
  {
    id: 'housatonic',
    name: 'Housatonic River',
    region: 'connecticut',
    state: 'CT',
    // 01199000 (Falls Village): flow ✅ gage ✅ — NO TEMP
    // 01200500 (Gaylordsville): flow ✅ gage ✅ — NO TEMP
    // 01200600 (New Milford): temp ✅ flow ✅ gage ✅
    stationIds: ['01199000', '01200500', '01200600'],
    coordinates: { latitude: 41.9572, longitude: -73.3693 },
  },
  {
    id: 'naugatuck',
    name: 'Naugatuck River',
    region: 'connecticut',
    state: 'CT',
    // 01206900 (Thomaston): flow ✅ gage ✅ — NO TEMP
    // 01208500 (Beacon Falls): temp ✅ flow ✅ gage ✅
    stationIds: ['01206900', '01208500'],
    coordinates: { latitude: 41.6736, longitude: -73.0695 },
  },
  {
    id: 'shetucket',
    name: 'Shetucket River',
    region: 'connecticut',
    state: 'CT',
    // 01122500 (Willimantic): flow ✅ gage ✅ — NO TEMP
    // 011230695 (Taftville): flow ✅ gage ✅ — NO TEMP
    // ⚠️ No water temperature data at any station
    stationIds: ['01122500', '011230695'],
    coordinates: { latitude: 41.7003, longitude: -72.1820 },
  },

  // ============================================================================
  // NC High Country (Boone / Blowing Rock / Valle Crucis)
  // ============================================================================
  {
    id: 'watauga',
    name: 'Watauga River',
    region: 'nc-highcountry',
    state: 'NC',
    // 03479000 (Sugar Grove): flow ✅ gage ✅ — NO TEMP
    // Runs through Valle Crucis — premier NC trout water
    stationIds: ['03479000'],
    coordinates: { latitude: 36.2392, longitude: -81.8222 },
  },
  {
    id: 'south-fork-new',
    name: 'South Fork New River',
    region: 'nc-highcountry',
    state: 'NC',
    // 03161000 (Jefferson): flow ✅ gage ✅ — NO TEMP
    stationIds: ['03161000'],
    coordinates: { latitude: 36.3933, longitude: -81.4069 },
  },
  {
    id: 'elk-creek-nc',
    name: 'Elk Creek',
    region: 'nc-highcountry',
    state: 'NC',
    // 02111180 (Elkville): flow ✅ gage ✅ — NO TEMP
    stationIds: ['02111180'],
    coordinates: { latitude: 36.0714, longitude: -81.4031 },
  },

  // ============================================================================
  // NC Foothills / Charlotte Region
  // ============================================================================
  {
    id: 'linville',
    name: 'Linville River',
    region: 'nc-foothills',
    state: 'NC',
    // 02138500 (Nebo): flow ✅ gage ✅ — NO TEMP
    stationIds: ['02138500'],
    coordinates: { latitude: 35.7956, longitude: -81.8911 },
  },
  {
    id: 'wilson-creek',
    name: 'Wilson Creek',
    region: 'nc-foothills',
    state: 'NC',
    // 02140510 (Adako): gage ✅ — NO TEMP, NO FLOW
    // Wild trout water in Pisgah National Forest
    stationIds: ['02140510'],
    coordinates: { latitude: 35.8989, longitude: -81.7159 },
  },
  {
    id: 'johns-river',
    name: 'Johns River',
    region: 'nc-foothills',
    state: 'NC',
    // 02140991 (Arneys Store): flow ✅ gage ✅ — NO TEMP
    stationIds: ['02140991'],
    coordinates: { latitude: 35.8336, longitude: -81.7119 },
  },
  {
    id: 'south-fork-catawba',
    name: 'South Fork Catawba River',
    region: 'nc-foothills',
    state: 'NC',
    // 02145000 (Lowell): flow ✅ gage ✅ — NO TEMP
    // Closest monitored trout water to Charlotte
    stationIds: ['02145000'],
    coordinates: { latitude: 35.2853, longitude: -81.1011 },
  },
  {
    id: 'catawba-upper',
    name: 'Catawba River (Upper)',
    region: 'nc-foothills',
    state: 'NC',
    // 02137727 (Pleasant Gardens): temp ✅ flow ✅ gage ✅
    // 02138520 (Below Lake James): temp ✅ flow ✅ gage ✅
    stationIds: ['02137727', '02138520'],
    coordinates: { latitude: 35.6858, longitude: -82.0603 },
  },
  {
    id: 'south-toe',
    name: 'South Toe River',
    region: 'nc-foothills',
    state: 'NC',
    // 03463300 (Celo): flow ✅ gage ✅ — NO TEMP
    // Excellent wild trout stream near Mt. Mitchell
    stationIds: ['03463300'],
    coordinates: { latitude: 35.8314, longitude: -82.1842 },
  },
] as const;

/**
 * Get streams by region
 */
export function getStreamsByRegion(region: Stream['region']): Stream[] {
  return STREAMS.filter((s) => s.region === region);
}

/**
 * Get streams by state
 */
export function getStreamsByState(state: Stream['state']): Stream[] {
  return STREAMS.filter((s) => s.state === state);
}

/**
 * Get stream by ID
 */
export function getStreamById(id: string): Stream | undefined {
  return STREAMS.find((s) => s.id === id);
}

/**
 * Get all unique station IDs
 */
export function getAllStationIds(): string[] {
  return [...new Set(STREAMS.flatMap((s) => s.stationIds))];
}

/**
 * Filter streams by query parameters (region or state).
 * Accepts raw string | null values from URL search params.
 * Returns filtered streams along with the validated filter values.
 */
export function filterStreamsByQuery(params: {
  region?: string | null;
  state?: string | null;
}): { streams: Stream[]; region?: string; state?: string } {
  const regionParsed = RegionSchema.safeParse(params.region);
  const stateParsed = StateSchema.safeParse(params.state);

  if (regionParsed.success) {
    return { streams: getStreamsByRegion(regionParsed.data), region: regionParsed.data };
  }
  if (stateParsed.success) {
    return { streams: getStreamsByState(stateParsed.data), state: stateParsed.data };
  }
  return { streams: [...STREAMS] };
}
