/**
 * Stream and station configuration for NY/NJ fishing waters
 */

import type { Stream } from '../models/types.ts';

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
    stationIds: ['01420500', '01418500', '01418000'],
    coordinates: { latitude: 41.9365, longitude: -74.9201 },
  },
  {
    id: 'willowemoc',
    name: 'Willowemoc Creek',
    region: 'catskills',
    state: 'NY',
    stationIds: ['01419500'],
    coordinates: { latitude: 41.9001, longitude: -74.8254 },
  },
  {
    id: 'esopus',
    name: 'Esopus Creek',
    region: 'catskills',
    state: 'NY',
    stationIds: ['01362200', '01362500', '01364500'],
    coordinates: { latitude: 42.0459, longitude: -74.2768 },
  },
  {
    id: 'neversink',
    name: 'Neversink River',
    region: 'catskills',
    state: 'NY',
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
    stationIds: ['01413500', '01417000', '01417500', '01421000', '01421500'],
    coordinates: { latitude: 42.1379, longitude: -74.6574 },
  },
  {
    id: 'west-branch-delaware',
    name: 'West Branch Delaware River',
    region: 'delaware',
    state: 'NY',
    stationIds: ['01423000', '01425000', '01426500', '01427000'],
    coordinates: { latitude: 42.0215, longitude: -75.1154 },
  },

  // ============================================================================
  // Croton System - NY (Westchester/Putnam)
  // ============================================================================
  {
    id: 'east-branch-croton',
    name: 'East Branch Croton River',
    region: 'croton',
    state: 'NY',
    stationIds: ['0137449480', '01374505', '01374531'],
    coordinates: { latitude: 41.3945, longitude: -73.6074 },
  },
  {
    id: 'west-branch-croton',
    name: 'West Branch Croton River',
    region: 'croton',
    state: 'NY',
    stationIds: ['01374559', '01374581', '0137462010'],
    coordinates: { latitude: 41.4704, longitude: -73.7595 },
  },
  {
    id: 'middle-branch-croton',
    name: 'Middle Branch Croton River',
    region: 'croton',
    state: 'NY',
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
    stationIds: ['01396500', '01398102'],
    coordinates: { latitude: 40.6682, longitude: -74.8971 },
  },
  {
    id: 'north-branch-raritan',
    name: 'North Branch Raritan River',
    region: 'raritan',
    state: 'NJ',
    stationIds: ['01400000'],
    coordinates: { latitude: 40.5654, longitude: -74.6354 },
  },
  {
    id: 'raritan-main',
    name: 'Raritan River (Main Stem)',
    region: 'raritan',
    state: 'NJ',
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
    stationIds: ['01440000'],
    coordinates: { latitude: 41.1154, longitude: -74.9501 },
  },
  {
    id: 'pequest',
    name: 'Pequest River',
    region: 'raritan',
    state: 'NJ',
    stationIds: ['01445500'],
    coordinates: { latitude: 40.9254, longitude: -74.9154 },
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
