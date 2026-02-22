-- ============================================================================
-- Seed data: Fly Shops
-- Source: src/data/fly-shops.ts
-- ============================================================================

insert into public.fly_shops (slug, name, region, state, address, location, phone, website, description, guide_service)
values
  -- Catskills Region - NY
  ('beaverkill-angler', 'Beaverkill Angler', 'catskills', 'NY',
   '2978 Old Route 17, Roscoe, NY 12776',
   st_point(-74.9101, 41.9365)::geography,
   '(607) 498-5194', 'https://beaverkillangler.com',
   'Full service fly shop in Trout Town USA. Guides, instruction, rentals, and the most reliable fishing reports for the Beaverkill and Willowemoc.',
   true),

  ('baxter-house', 'Baxter House River Outfitters', 'catskills', 'NY',
   '1316 Old Route 17, Roscoe, NY 12776',
   st_point(-74.9150, 41.9398)::geography,
   '(607) 498-5811', 'https://baxterhouse.net',
   '25+ years in business. Guides, lodging, and flies for the Upper Delaware, Beaverkill, and Willowemoc. Detailed blog-style fishing reports.',
   true),

  ('catskill-outfitters', 'Catskill Outfitters', 'catskills', 'NY',
   '46 Main St, Phoenicia, NY 12464',
   st_point(-74.3103, 42.0840)::geography,
   '(845) 688-2000', 'https://catskilloutfitters.com',
   'Fly shop, guides, and lessons based near Esopus Creek. Also carries camping and hiking gear. Great source for Esopus Creek conditions.',
   true),

  ('dette-flies', 'Dette Flies', 'catskills', 'NY',
   '10 Riverside Dr, Roscoe, NY 12776',
   st_point(-74.9130, 41.9347)::geography,
   '(607) 498-4991', null,
   'Legendary Catskill fly tying family since 1928. Hand-tied dry flies in classic patterns. A living piece of American fly fishing history.',
   false),

  -- Delaware System - NY
  ('al-caucci-fly-shop', 'Al Caucci''s Delaware River Club Fly Shop', 'delaware', 'NY',
   '1264 Winterdale Rd, Starlight, PA 18461',
   st_point(-75.0300, 41.9100)::geography,
   '(570) 635-5897', 'https://mayfly.com',
   'Renowned entomologist Al Caucci runs this shop near the Upper Delaware. Exceptional knowledge of the river system and hatches.',
   true),

  ('upper-delaware-outfitters', 'Upper Delaware Outfitters', 'delaware', 'NY',
   '37 Main St, Hancock, NY 13783',
   st_point(-75.2834, 41.9569)::geography,
   '(607) 637-4296', null,
   'Guides and gear for the East and West Branch Delaware. Located in Hancock at the confluence of both branches.',
   true),

  -- Croton Watershed - NY
  ('river-bay-outfitters', 'River Bay Outfitters', 'croton', 'NY',
   '36 Gleneida Ave, Carmel, NY 10512',
   st_point(-73.6802, 41.4310)::geography,
   '(845) 225-3499', 'https://riverbayoutfitters.com',
   'Fly fishing shop in the Croton watershed. Covers East, West, and Middle Branch Croton rivers. Local expertise for Westchester/Putnam waters.',
   true),

  -- Raritan / NJ
  ('ramsey-outdoor', 'Ramsey Outdoor', 'raritan', 'NJ',
   '240 Route 17 North, Paramus, NJ 07652',
   st_point(-74.0700, 40.9585)::geography,
   '(201) 261-5000', 'https://ramseyoutdoor.com',
   'Full service outdoor retailer with a well-stocked fly fishing section. Covers NJ trout waters including the Raritan system, Flat Brook, and Pequest.',
   false),

  ('shannon-fly-angler', 'Shannon''s Fly & Tackle', 'raritan', 'NJ',
   '1718 Route 10, Parsippany, NJ 07054',
   st_point(-74.4237, 40.8583)::geography,
   '(973) 263-1080', 'https://shannonsflyandtackle.com',
   'Dedicated fly shop serving central NJ. Expert knowledge of the South Branch Raritan, Musconetcong, and Pequest rivers.',
   true),

  ('tight-lines-fly-fishing', 'Tight Lines Fly Fishing', 'raritan', 'NJ',
   '4 Coddington Rd, Califon, NJ 07830',
   st_point(-74.8363, 40.7194)::geography,
   '(908) 832-2580', null,
   'Small fly shop near the South Branch Raritan in Hunterdon County. Guided trips and local expertise for NJ wild trout waters.',
   true),

  -- Connecticut
  ('housatonic-river-outfitters', 'Housatonic River Outfitters', 'connecticut', 'CT',
   '24 Kent Rd, Cornwall Bridge, CT 06754',
   st_point(-73.3688, 41.8237)::geography,
   '(860) 672-1010', 'https://dryflies.com',
   'Premier fly shop on the Housatonic TMA. Guides, instruction, and flies. The go-to source for Housatonic River conditions.',
   true),

  ('upcountry-sportfishing', 'UpCountry Sportfishing', 'connecticut', 'CT',
   '362 Main St, New Hartford, CT 06057',
   st_point(-72.9764, 41.8792)::geography,
   '(860) 379-1952', 'https://farmingtonriver.com',
   'The Farmington River authority. Full service shop with guides, drift boat trips, and detailed daily fishing reports for the Farmington.',
   true),

  -- NC High Country
  ('foscoe-fishing', 'Foscoe Fishing Company', 'nc-highcountry', 'NC',
   '8775 NC-105, Foscoe, NC 28604',
   st_point(-81.7578, 36.1569)::geography,
   '(828) 963-7431', 'https://foscoefishing.com',
   'Full service fly shop in the NC High Country. Expert guides for the Watauga, Elk Creek, and South Fork New River.',
   true),

  ('mountain-sports-ltd', 'Mountain Sports Ltd', 'nc-highcountry', 'NC',
   '207 S Depot St, Boone, NC 28607',
   st_point(-81.6745, 36.2134)::geography,
   '(828) 264-7741', null,
   'Outdoor outfitter in downtown Boone with a fly fishing department. Covers the High Country trout waters around Boone and Valle Crucis.',
   false),

  -- NC Foothills / Charlotte Region
  ('jesse-brown-outdoors', 'Jesse Brown''s Outdoors', 'nc-foothills', 'NC',
   '4732 Sharon Rd, Charlotte, NC 28210',
   st_point(-80.8490, 35.1513)::geography,
   '(704) 556-0020', 'https://jessebrowns.com',
   'Charlotte-area fly shop since 1969. Guides for the Linville, Wilson Creek, and South Fork Catawba. Classes for all skill levels.',
   true),

  ('hunter-banks-asheville', 'Hunter Banks Fly Fishing', 'nc-foothills', 'NC',
   '29 Montford Ave, Asheville, NC 28801',
   st_point(-82.5620, 35.5967)::geography,
   '(828) 252-3005', 'https://hunterbanks.com',
   'Asheville fly shop covering western NC waters. Expert guides for the South Toe, Upper Catawba, and Johns River.',
   true);
