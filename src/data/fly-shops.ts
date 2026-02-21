/**
 * Fly shop directory for NY/NJ/CT/NC fishing regions
 *
 * Data sourced from research/fly-shops.md and verified shop listings.
 * Each shop is associated with the nearest fishing region.
 */

import type { FlyShop } from '../models/types.ts';
import { RegionSchema, StateSchema } from '../models/types.ts';

/**
 * Curated list of fly shops serving the app's covered regions
 */
export const FLY_SHOPS: readonly FlyShop[] = [
  // ============================================================================
  // Catskills Region - NY
  // ============================================================================
  {
    id: 'beaverkill-angler',
    name: 'Beaverkill Angler',
    region: 'catskills',
    state: 'NY',
    address: '2978 Old Route 17, Roscoe, NY 12776',
    coordinates: { latitude: 41.9365, longitude: -74.9101 },
    phone: '(607) 498-5194',
    website: 'https://beaverkillangler.com',
    description:
      'Full service fly shop in Trout Town USA. Guides, instruction, rentals, and the most reliable fishing reports for the Beaverkill and Willowemoc.',
  },
  {
    id: 'baxter-house',
    name: 'Baxter House River Outfitters',
    region: 'catskills',
    state: 'NY',
    address: '1316 Old Route 17, Roscoe, NY 12776',
    coordinates: { latitude: 41.9398, longitude: -74.9150 },
    phone: '(607) 498-5811',
    website: 'https://baxterhouse.net',
    description:
      '25+ years in business. Guides, lodging, and flies for the Upper Delaware, Beaverkill, and Willowemoc. Detailed blog-style fishing reports.',
  },
  {
    id: 'catskill-outfitters',
    name: 'Catskill Outfitters',
    region: 'catskills',
    state: 'NY',
    address: '46 Main St, Phoenicia, NY 12464',
    coordinates: { latitude: 42.0840, longitude: -74.3103 },
    phone: '(845) 688-2000',
    website: 'https://catskilloutfitters.com',
    description:
      'Fly shop, guides, and lessons based near Esopus Creek. Also carries camping and hiking gear. Great source for Esopus Creek conditions.',
  },
  {
    id: 'dette-flies',
    name: 'Dette Flies',
    region: 'catskills',
    state: 'NY',
    address: '10 Riverside Dr, Roscoe, NY 12776',
    coordinates: { latitude: 41.9347, longitude: -74.9130 },
    phone: '(607) 498-4991',
    description:
      'Legendary Catskill fly tying family since 1928. Hand-tied dry flies in classic patterns. A living piece of American fly fishing history.',
  },

  // ============================================================================
  // Delaware System - NY
  // ============================================================================
  {
    id: 'al-caucci-fly-shop',
    name: "Al Caucci's Delaware River Club Fly Shop",
    region: 'delaware',
    // Physically in PA but serves the NY Delaware River region; PA is not in StateSchema
    state: 'NY',
    address: '1264 Winterdale Rd, Starlight, PA 18461',
    coordinates: { latitude: 41.9100, longitude: -75.0300 },
    phone: '(570) 635-5897',
    website: 'https://mayfly.com',
    description:
      'Renowned entomologist Al Caucci runs this shop near the Upper Delaware. Exceptional knowledge of the river system and hatches.',
  },
  {
    id: 'upper-delaware-outfitters',
    name: 'Upper Delaware Outfitters',
    region: 'delaware',
    state: 'NY',
    address: '37 Main St, Hancock, NY 13783',
    coordinates: { latitude: 41.9569, longitude: -75.2834 },
    phone: '(607) 637-4296',
    description:
      'Guides and gear for the East and West Branch Delaware. Located in Hancock at the confluence of both branches.',
  },

  // ============================================================================
  // Croton Watershed - NY (Westchester/Putnam)
  // ============================================================================
  {
    id: 'river-bay-outfitters',
    name: 'River Bay Outfitters',
    region: 'croton',
    state: 'NY',
    address: '36 Gleneida Ave, Carmel, NY 10512',
    coordinates: { latitude: 41.4310, longitude: -73.6802 },
    phone: '(845) 225-3499',
    website: 'https://riverbayoutfitters.com',
    description:
      'Fly fishing shop in the Croton watershed. Covers East, West, and Middle Branch Croton rivers. Local expertise for Westchester/Putnam waters.',
  },

  // ============================================================================
  // Raritan / NJ
  // ============================================================================
  {
    id: 'ramsey-outdoor',
    name: 'Ramsey Outdoor',
    region: 'raritan',
    state: 'NJ',
    address: '240 Route 17 North, Paramus, NJ 07652',
    coordinates: { latitude: 40.9585, longitude: -74.0700 },
    phone: '(201) 261-5000',
    website: 'https://ramseyoutdoor.com',
    description:
      'Full service outdoor retailer with a well-stocked fly fishing section. Covers NJ trout waters including the Raritan system, Flat Brook, and Pequest.',
  },
  {
    id: 'shannon-fly-angler',
    name: "Shannon's Fly & Tackle",
    region: 'raritan',
    state: 'NJ',
    address: '1718 Route 10, Parsippany, NJ 07054',
    coordinates: { latitude: 40.8583, longitude: -74.4237 },
    phone: '(973) 263-1080',
    website: 'https://shannonsflyandtackle.com',
    description:
      'Dedicated fly shop serving central NJ. Expert knowledge of the South Branch Raritan, Musconetcong, and Pequest rivers.',
  },
  {
    id: 'tight-lines-fly-fishing',
    name: 'Tight Lines Fly Fishing',
    region: 'raritan',
    state: 'NJ',
    address: '4 Coddington Rd, Califon, NJ 07830',
    coordinates: { latitude: 40.7194, longitude: -74.8363 },
    phone: '(908) 832-2580',
    description:
      'Small fly shop near the South Branch Raritan in Hunterdon County. Guided trips and local expertise for NJ wild trout waters.',
  },

  // ============================================================================
  // Connecticut
  // ============================================================================
  {
    id: 'housatonic-river-outfitters',
    name: 'Housatonic River Outfitters',
    region: 'connecticut',
    state: 'CT',
    address: '24 Kent Rd, Cornwall Bridge, CT 06754',
    coordinates: { latitude: 41.8237, longitude: -73.3688 },
    phone: '(860) 672-1010',
    website: 'https://dryflies.com',
    description:
      'Premier fly shop on the Housatonic TMA. Guides, instruction, and flies. The go-to source for Housatonic River conditions.',
  },
  {
    id: 'upcountry-sportfishing',
    name: 'UpCountry Sportfishing',
    region: 'connecticut',
    state: 'CT',
    address: '362 Main St, New Hartford, CT 06057',
    coordinates: { latitude: 41.8792, longitude: -72.9764 },
    phone: '(860) 379-1952',
    website: 'https://farmingtonriver.com',
    description:
      'The Farmington River authority. Full service shop with guides, drift boat trips, and detailed daily fishing reports for the Farmington.',
  },

  // ============================================================================
  // NC High Country (Boone / Blowing Rock / Valle Crucis)
  // ============================================================================
  {
    id: 'foscoe-fishing',
    name: 'Foscoe Fishing Company',
    region: 'nc-highcountry',
    state: 'NC',
    address: '8775 NC-105, Foscoe, NC 28604',
    coordinates: { latitude: 36.1569, longitude: -81.7578 },
    phone: '(828) 963-7431',
    website: 'https://foscoefishing.com',
    description:
      'Full service fly shop in the NC High Country. Expert guides for the Watauga, Elk Creek, and South Fork New River.',
  },
  {
    id: 'mountain-sports-ltd',
    name: 'Mountain Sports Ltd',
    region: 'nc-highcountry',
    state: 'NC',
    address: '207 S Depot St, Boone, NC 28607',
    coordinates: { latitude: 36.2134, longitude: -81.6745 },
    phone: '(828) 264-7741',
    description:
      'Outdoor outfitter in downtown Boone with a fly fishing department. Covers the High Country trout waters around Boone and Valle Crucis.',
  },

  // ============================================================================
  // NC Foothills / Charlotte Region
  // ============================================================================
  {
    id: 'jesse-brown-outdoors',
    name: "Jesse Brown's Outdoors",
    region: 'nc-foothills',
    state: 'NC',
    address: '4732 Sharon Rd, Charlotte, NC 28210',
    coordinates: { latitude: 35.1513, longitude: -80.8490 },
    phone: '(704) 556-0020',
    website: 'https://jessebrowns.com',
    description:
      'Charlotte-area fly shop since 1969. Guides for the Linville, Wilson Creek, and South Fork Catawba. Classes for all skill levels.',
  },
  {
    id: 'hunter-banks-asheville',
    name: 'Hunter Banks Fly Fishing',
    region: 'nc-foothills',
    state: 'NC',
    address: '29 Montford Ave, Asheville, NC 28801',
    coordinates: { latitude: 35.5967, longitude: -82.5620 },
    phone: '(828) 252-3005',
    website: 'https://hunterbanks.com',
    description:
      'Asheville fly shop covering western NC waters. Expert guides for the South Toe, Upper Catawba, and Johns River.',
  },
] as const;

/**
 * Get fly shops by region
 */
export function getShopsByRegion(region: FlyShop['region']): FlyShop[] {
  return FLY_SHOPS.filter((s) => s.region === region);
}

/**
 * Get fly shops by state
 */
export function getShopsByState(state: FlyShop['state']): FlyShop[] {
  return FLY_SHOPS.filter((s) => s.state === state);
}

/**
 * Get fly shop by ID
 */
export function getShopById(id: string): FlyShop | undefined {
  return FLY_SHOPS.find((s) => s.id === id);
}

/**
 * Filter fly shops by query parameters (region or state).
 * Accepts raw string | null values from URL search params.
 * Region takes precedence over state when both are valid.
 * Falls back to all shops if neither parameter is valid.
 */
export function filterShopsByQuery(params: {
  region?: string | null;
  state?: string | null;
}): { shops: FlyShop[]; region?: string; state?: string } {
  const regionParsed = RegionSchema.safeParse(params.region);
  const stateParsed = StateSchema.safeParse(params.state);

  if (regionParsed.success) {
    return { shops: getShopsByRegion(regionParsed.data), region: regionParsed.data };
  }
  if (stateParsed.success) {
    return { shops: getShopsByState(stateParsed.data), state: stateParsed.data };
  }
  return { shops: [...FLY_SHOPS] };
}
