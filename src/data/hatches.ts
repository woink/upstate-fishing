/**
 * Hatch data for Northeast US trout streams
 * Temperature thresholds based on research and regional fly shop data
 */

import type { Hatch } from '../models/types.ts';

/**
 * Curated hatch data for Northeast streams
 * Temperatures are triggers for emergence (water temp in °F)
 */
export const HATCHES: readonly Hatch[] = [
  // ============================================================================
  // Mayflies (Ephemeroptera)
  // ============================================================================
  {
    id: 'hendrickson',
    commonName: 'Hendrickson',
    scientificName: 'Ephemerella subvaria',
    order: 'mayfly',
    minTempF: 50,
    maxTempF: 58,
    peakMonths: [4, 5],
    timeOfDay: 'afternoon',
    prefersOvercast: true,
    hookSizes: [12, 14],
    notes:
      'Official start of dry fly season. Males (Red Quills) are darker. Females (Light Hendricksons) are tan/yellow.',
  },
  {
    id: 'bwo',
    commonName: 'Blue Winged Olive',
    scientificName: 'Baetis spp.',
    order: 'mayfly',
    minTempF: 46,
    maxTempF: 56,
    peakMonths: [3, 4, 5, 9, 10, 11],
    timeOfDay: 'any',
    prefersOvercast: true,
    hookSizes: [16, 18, 20],
    notes:
      'Best on overcast, drizzly days. Hatches in spring and fall as temps pass through range.',
  },
  {
    id: 'march-brown',
    commonName: 'March Brown',
    scientificName: 'Maccaffertium vicarium',
    order: 'mayfly',
    minTempF: 54,
    maxTempF: 62,
    peakMonths: [5, 6],
    timeOfDay: 'midday',
    prefersOvercast: false,
    hookSizes: [10, 12],
    notes:
      'Despite name, hatches in May. Not a blanket hatch - steady trickle. Good for blind casting.',
  },
  {
    id: 'sulphur-big',
    commonName: 'Big Sulphur',
    scientificName: 'Ephemerella invaria',
    order: 'mayfly',
    minTempF: 56,
    maxTempF: 64,
    peakMonths: [5, 6],
    timeOfDay: 'evening',
    prefersOvercast: false,
    hookSizes: [14, 16],
    notes: 'Overlaps with late Hendricksons. Can look like yellowish female Hendrickson.',
  },
  {
    id: 'sulphur-little',
    commonName: 'Little Summer Sulphur',
    scientificName: 'Ephemerella dorothea',
    order: 'mayfly',
    minTempF: 58,
    maxTempF: 68,
    peakMonths: [6, 7, 8],
    timeOfDay: 'evening',
    prefersOvercast: false,
    hookSizes: [16, 18, 20],
    notes: 'Dog days hatch. Fish are spooky - use 6X/7X tippet. Best on tailwaters.',
  },
  {
    id: 'green-drake',
    commonName: 'Green Drake',
    scientificName: 'Ephemera guttulata',
    order: 'mayfly',
    minTempF: 58,
    maxTempF: 66,
    peakMonths: [5, 6],
    timeOfDay: 'evening',
    prefersOvercast: false,
    hookSizes: [8, 10],
    notes: 'Iconic large mayfly. Time of day varies by river. Often evening into dark.',
  },
  {
    id: 'pmd',
    commonName: 'Pale Morning Dun',
    scientificName: 'Ephemerella excrucians',
    order: 'mayfly',
    minTempF: 58,
    maxTempF: 66,
    peakMonths: [6, 7],
    timeOfDay: 'morning',
    prefersOvercast: false,
    hookSizes: [16, 18],
    notes: 'Peak in July. Can overlap with Yellow Sallies.',
  },
  {
    id: 'quill-gordon',
    commonName: 'Quill Gordon',
    scientificName: 'Epeorus pleuralis',
    order: 'mayfly',
    minTempF: 48,
    maxTempF: 54,
    peakMonths: [4, 5],
    timeOfDay: 'afternoon',
    prefersOvercast: true,
    hookSizes: [12, 14],
    notes: 'Classic Catskill pattern. One of the earliest hatches. Cold water species.',
  },
  {
    id: 'isonychia',
    commonName: 'Isonychia / Slate Drake',
    scientificName: 'Isonychia bicolor',
    order: 'mayfly',
    minTempF: 60,
    maxTempF: 70,
    peakMonths: [6, 7, 8, 9],
    timeOfDay: 'evening',
    prefersOvercast: false,
    hookSizes: [10, 12],
    notes: 'Large mayfly. Swim to shore to emerge. Good streamer target too.',
  },

  // ============================================================================
  // Caddisflies (Trichoptera)
  // ============================================================================
  {
    id: 'caddis-tan',
    commonName: 'Tan Caddis',
    scientificName: 'Hydropsyche spp.',
    order: 'caddisfly',
    minTempF: 54,
    maxTempF: 70,
    peakMonths: [4, 5, 6, 7, 8, 9],
    timeOfDay: 'evening',
    prefersOvercast: false,
    hookSizes: [14, 16],
    notes: 'Most common caddis. Active skittering on surface.',
  },
  {
    id: 'caddis-olive',
    commonName: 'Olive Caddis',
    scientificName: 'Rhyacophila spp.',
    order: 'caddisfly',
    minTempF: 50,
    maxTempF: 65,
    peakMonths: [4, 5, 6],
    timeOfDay: 'afternoon',
    prefersOvercast: false,
    hookSizes: [14, 16],
    notes: 'Free-living caddis. Green rock worm larvae.',
  },
  {
    id: 'grannom',
    commonName: 'Grannom / Apple Caddis',
    scientificName: 'Brachycentrus spp.',
    order: 'caddisfly',
    minTempF: 48,
    maxTempF: 58,
    peakMonths: [4, 5],
    timeOfDay: 'afternoon',
    prefersOvercast: false,
    hookSizes: [14, 16],
    notes: 'Early season. Females carry green egg sacs.',
  },
  {
    id: 'october-caddis',
    commonName: 'October Caddis',
    scientificName: 'Dicosmoecus spp.',
    order: 'caddisfly',
    minTempF: 45,
    maxTempF: 55,
    peakMonths: [9, 10, 11],
    timeOfDay: 'afternoon',
    prefersOvercast: false,
    hookSizes: [6, 8, 10],
    notes: 'Large fall caddis. Orange body. Good late season action.',
  },

  // ============================================================================
  // Stoneflies (Plecoptera)
  // ============================================================================
  {
    id: 'yellow-sally',
    commonName: 'Yellow Sally',
    scientificName: 'Isoperla spp.',
    order: 'stonefly',
    minTempF: 56,
    maxTempF: 68,
    peakMonths: [5, 6, 7],
    timeOfDay: 'morning',
    prefersOvercast: false,
    hookSizes: [14, 16],
    notes: 'Small yellow stonefly. Can overlap with PMDs.',
  },
  {
    id: 'early-brown-stone',
    commonName: 'Early Brown Stonefly',
    scientificName: 'Strophopteryx fasciata',
    order: 'stonefly',
    minTempF: 40,
    maxTempF: 50,
    peakMonths: [3, 4],
    timeOfDay: 'afternoon',
    prefersOvercast: false,
    hookSizes: [12, 14],
    notes: 'Very early season. Fish the nymph near banks.',
  },
  {
    id: 'golden-stone',
    commonName: 'Golden Stonefly',
    scientificName: 'Perlidae spp.',
    order: 'stonefly',
    minTempF: 55,
    maxTempF: 65,
    peakMonths: [5, 6],
    timeOfDay: 'any',
    prefersOvercast: false,
    hookSizes: [8, 10],
    notes: 'Larger stonefly. Good dry fly fishing. Crawls to shore to emerge.',
  },

  // ============================================================================
  // Midges (Diptera)
  // ============================================================================
  {
    id: 'midge',
    commonName: 'Midge',
    scientificName: 'Chironomidae',
    order: 'midge',
    minTempF: 35,
    maxTempF: 70,
    peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    timeOfDay: 'any',
    prefersOvercast: false,
    hookSizes: [18, 20, 22, 24],
    notes: 'Year-round. Primary food source when nothing else hatches. Cluster patterns work well.',
  },
] as const;

/**
 * Get hatches active for a given month
 */
export function getHatchesByMonth(month: number): Hatch[] {
  return HATCHES.filter((h) => h.peakMonths.includes(month));
}

/**
 * Get hatches that could occur at a given water temperature
 */
export function getHatchesByTemp(tempF: number): Hatch[] {
  return HATCHES.filter((h) => tempF >= h.minTempF && tempF <= h.maxTempF);
}

/**
 * Get hatches by insect order
 */
export function getHatchesByOrder(order: Hatch['order']): Hatch[] {
  return HATCHES.filter((h) => h.order === order);
}
