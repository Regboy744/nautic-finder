# NauticFinder.ai — Complete Broker & Listing Websites Directory

## Scraping Target List — All Tiers

This document contains all known boat listing websites, aggregators, marketplaces, and MLS data feeds organized by priority tier. Use this list to plan and execute the scraping strategy for NauticFinder.ai.

---

## TIER 1 — The Big 3 (Boats Group Network)

These three are owned by the same parent company (Boats Group). They share broker networks, so there is significant listing overlap between them. Similar site structures mean one scraper template can likely be adapted across all three.

| # | Website | URL | Estimated Listings | Region Focus | Notes |
|---|---------|-----|-------------------|--------------|-------|
| 1 | boats.com | https://www.boats.com | ~120,000 | Global | Largest single collection of boats online. Includes reviews and editorial content. |
| 2 | Boat Trader | https://www.boattrader.com | ~108,000 | USA primary | Largest US marketplace. 2M+ unique visitors/month. Has "boato" AI image recognition tool. Has Price Checker tool — useful data source for market pricing. |
| 3 | YachtWorld | https://www.yachtworld.com | ~80,000 | Global | Longest-standing online yacht marketplace. Broker-only listings (no private sellers). Largest MLS in marine industry with 70,000+ co-brokerage vessels. ~3,000 international brokerages. Specializes in yachts and high-end vessels. |

**Tier 1 Total (with overlap): ~300,000 listings**
**Tier 1 Estimated Unique Boats: ~150,000–200,000**

**Priority: SCRAPE FIRST (Week 1-2)**

---

## TIER 2 — Major Independent Platforms

Large, independent platforms not owned by Boats Group. Each has its own broker network and unique inventory.

| # | Website | URL | Estimated Listings | Region Focus | Notes |
|---|---------|-----|-------------------|--------------|-------|
| 4 | Rightboat | https://www.rightboat.com | ~50,000+ | Global | 500,000+ buyers monthly. Listings from brokers, dealers, and manufacturers. Also offers charter listings. Strong UK and European presence. |
| 5 | TheYachtMarket | https://www.theyachtmarket.com | ~50,000+ | Global | Major independent marketplace. 250,000+ unique visitors and 5-6 million page views per month. Wide variety from small boats to superyachts. |
| 6 | Boat24 | https://www.boat24.com | ~34,000 | Europe | Europe's leading boat marketplace. 900+ brokers and dealers. 100+ search filters. Strong in Germany, Scandinavia, Mediterranean. |
| 7 | YATCO | https://www.yatco.com | ~15,000 | Global (luxury) | Premier luxury yacht marketplace. Official MLS for Yacht Brokers Association of America (YBAA) and California Yacht Brokers Association (CYBA). Also has 2,000 charter yachts and 30,000+ professional businesses. Potential API/data feed access via YATCO BOSS platform. Supports $7.5 billion in annual transactions. |
| 8 | Scanboat | https://www.scanboat.com | ~14,000 | Northern Europe | Originally launched 1997 as boat4you.dk. Strongest in Nordic countries (Denmark, Sweden, Norway, Finland). Covers all of Europe. Has search alert/agent feature. |

**Tier 2 Total (with overlap): ~160,000 listings**
**Tier 2 Estimated Additional Unique Boats: ~100,000–130,000**

**Priority: SCRAPE SECOND (Week 3-4)**

---

## TIER 3 — Regional, Niche & Secondary Platforms

Smaller platforms that serve specific regions, boat types, or market segments. Important for coverage completeness.

### Europe

| # | Website | URL | Estimated Listings | Region Focus | Notes |
|---|---------|-----|-------------------|--------------|-------|
| 9 | Apollo Duck | https://www.apolloduck.com | ~10,000+ | UK, Ireland, Europe | Important for Dublin/Ireland base. Has regional subdomains: apolloduck.co.uk, apolloduck.ie, apolloduck.eu. Free photo ads for sellers. Covers yachts, power boats, superyachts, cruisers, houseboats, fishing boats, and ships. |
| 10 | Boatshop24 | https://www.boatshop24.com | ~30,000+ | International | Claims to be "#1 international boat marketplace." Shares some inventory with Boat24. |
| 11 | Band of Boats | https://www.bandofboats.com | ~7,000 | France, Mediterranean | Strong in France. 300+ professional dealers. Offers boat valuation service based on 68,000+ boats appraised since 2009. Available in French, English, Italian, Spanish, German. |
| 12 | TopBoats | https://www.topboats.com | ~5,000+ | Europe | Motor boats, yachts, sailboats, rigid boats. Also lists boat engines and nautical accessories. |
| 13 | Sailboatdata.com | https://sailboatdata.com | N/A (specs database) | Global | Not a sales listing site — it's a comprehensive sailboat specifications database. Extremely valuable for model comparison data, performance ratios, and technical specs. Use as a supplementary data source to enrich your boat records with detailed specifications. |
| 14 | Botentekoop.nl | https://www.botentekoop.nl | ~15,000+ | Netherlands | Largest Dutch boat marketplace. Important for Northern European coverage. |
| 15 | Cosasdebarcos.com | https://www.cosasdebarcos.com | ~10,000+ | Spain | Major Spanish boat marketplace. Important for Mediterranean coverage. |
| 16 | iNautia | https://www.inautia.com | ~30,000+ | Spain, Italy, France | Large Mediterranean marketplace. Available in multiple languages. Covers boats, engines, trailers, and nautical equipment. |
| 17 | Annonces du Bateau | https://www.annoncesbateau.com | ~10,000+ | France | Major French boat classifieds. Strong in used boats. |
| 18 | Boat24.de | https://www.boat24.com/de/ | ~34,000 | Germany/DACH | German-language version of Boat24. Same inventory but important for German market SEO and localized data. |

### North America

| # | Website | URL | Estimated Listings | Region Focus | Notes |
|---|---------|-----|-------------------|--------------|-------|
| 19 | POP Yachts | https://www.popyachts.com | ~5,000+ | USA | Commission-based broker. 35,000+ units sold since 2009. Handles full listing process on behalf of sellers. Relationships with 100+ partner sites. Minimum $2,750 commission — caters to larger vessels. |
| 20 | iBoats | https://boats.iboats.com | ~10,000+ | USA | Boat sales + one of the largest boating forums online. Community-driven. Also sells boat parts and accessories — relevant for future NauticFinder expansion. |
| 21 | BoatCrazy | https://boatcrazy.com | ~5,000+ | USA | Private sellers and dealers. Low-cost listings ($19 basic). Listings also appear on Google Shopping and Meta networks. |
| 22 | MarineMax | https://www.marinemax.com | ~3,000+ | USA | Major dealer network. Primarily new boats. Important for new boat inventory and pricing data. |
| 23 | Boats.net | https://www.boats.net | N/A (parts) | USA | Not boat sales — marine parts and accessories marketplace. Relevant for future NauticFinder expansion into boat parts. |
| 24 | Discover Boating | https://www.discoverboating.com | N/A (tool) | USA/Canada | Has a Boat Finder Tool for comparing boat types. Good reference data source, not a listing site. Industry association (NMMA) backed. |
| 25 | Boat Wizard | https://www.boatwizard.com | N/A (B2B tool) | USA | Boats Group's dealer/broker management tool. Has AI-powered listing builder and Market Evaluation Tool. Potential B2B data partnership opportunity. |

### Australia & Asia Pacific

| # | Website | URL | Estimated Listings | Region Focus | Notes |
|---|---------|-----|-------------------|--------------|-------|
| 26 | boatsales.com.au | https://www.boatsales.com.au | ~20,000+ | Australia | 3rd most visited boats website globally (Similarweb). Dominant in Australian market. Part of the carsales.com.au network. |
| 27 | Tradeboats.com.au | https://www.tradeboats.com.au | ~5,000+ | Australia | Second major Australian boat marketplace. Associated with Trade-A-Boat magazine. |
| 28 | Boatdeck.com | https://www.boatdeck.com | ~3,000+ | Asia Pacific | Growing marketplace for Southeast Asia and Pacific region. |

### Specialty & Niche

| # | Website | URL | Estimated Listings | Region Focus | Notes |
|---|---------|-----|-------------------|--------------|-------|
| 29 | DailyBoats | https://dailyboats.com | ~5,000+ | Global | Mixed marketplace. Also includes boat rental listings. Covers power, sailing, and commercial boats. |
| 30 | Yacht Broker (YachtBroker.org) | https://www.yachtbroker.org | N/A (directory) | Global | Not a listing site — it's the International Yacht Brokers Association. Important for broker directory data and professional contacts. |
| 31 | SuperYacht Times | https://www.superyachttimes.com | ~2,000+ | Global (luxury) | Focused on superyachts and luxury segment. News outlet + listing platform. Premium audience. |
| 32 | Boat International | https://www.boatinternational.com | ~3,000+ | Global (luxury) | Major yachting media + luxury yacht listings. High domain authority — good for backlinks and industry credibility. |
| 33 | YachtBuyer | https://www.yachtbuyer.com | ~5,000+ | Global | Has a Model Compare tool for side-by-side yacht comparison. Tests and reviews. Good supplementary data source. |
| 34 | The Hull Truth | https://www.thehulltruth.com | N/A (forum) | USA | 2nd most visited boats website globally (Similarweb). Boating forum, not listings. Extremely valuable for community sentiment, boat reviews, and real-owner experiences. Consider scraping forum discussions for AI knowledge enrichment. |
| 35 | Cruiser Forum | https://www.cruisersforum.com | N/A (forum) | Global | Major sailing/cruising community forum. Valuable for real-world boat reviews and owner experiences. |
| 36 | Sailing Anarchy | https://sailinganarchy.com | N/A (forum/news) | Global | Sailing community and news. Good for sailing boat reputation data. |
| 37 | Denison Yachting | https://www.denisonyachting.com | ~3,000+ | USA/Global | One of the largest yacht brokerages. May have exclusive listings not on aggregators. |
| 38 | United Yacht Sales | https://www.unitedyacht.com | ~5,000+ | Global | World's largest yacht brokerage firm. 250+ brokers in 104 locations worldwide. Extensive MLS network. |
| 39 | Fraser Yachts | https://www.fraseryachts.com | ~1,000+ | Global (luxury) | Premier luxury yacht brokerage. Superyachts and mega yachts. |
| 40 | Burgess Yachts | https://www.burgessyachts.com | ~500+ | Global (luxury) | Top-tier superyacht brokerage. Ultra-luxury segment. |
| 41 | Northrop & Johnson | https://www.northropandjohnson.com | ~1,000+ | Global (luxury) | Major luxury yacht brokerage. Sales and charter. |
| 42 | Camper & Nicholsons | https://www.camperandnicholsons.com | ~500+ | Global (luxury) | Oldest yacht brokerage in the world (founded 1782). Ultra-luxury segment. |

**Tier 3 Total Estimated Additional Unique Boats: ~50,000–80,000**

**Priority: SCRAPE IN MONTH 2-3**

---

## TIER 4 — MLS Data Feeds & APIs (Structured Data Without Scraping)

These provide clean, structured data through official APIs or data feeds. More reliable than scraping, better data quality, and often include data not publicly visible on websites.

| # | Source | URL | Data Available | How to Access | Notes |
|---|--------|-----|---------------|---------------|-------|
| 43 | IYBA MLS | https://iyba.org/mls-data-feeds | Vessel data, broker profiles, charter data, events | Apply for API access. REST JSON format. IP-whitelisted HTTPS. Authentication keys provided. | International Yacht Brokers Association. 13,000+ yachts. Multiple endpoints: /vessel, /mlssearch, /charter, /brokerage. Supports filtering by length, brand, price range. |
| 44 | YATCO BOSS API | https://www.yatco.com | 15,000+ yachts, broker data, charter data | Apply for partnership/membership. Professional access. | Official MLS for YBAA and CYBA. Back-office software with API access. Supports $7.5B in annual transactions. AI-powered features. |
| 45 | Boats Group Data Feeds | https://www.boatsgroup.com | boats.com, Boat Trader, YachtWorld combined data | Apply for dealer/partner program. | The parent company of the Tier 1 sites. If you can get API access, you skip scraping their 3 sites entirely. |
| 46 | BoatSales.ai | https://boatsales.ai | Structured boat listings | API access (JSON schema) | AI-native listing platform. Clean JSON, metadata, condition scoring, semantic tagging. Designed specifically for machine consumption. Could be a supplementary data source. |
| 47 | Apify Pre-built Scrapers | https://apify.com | Various boat sites | Rent pre-built scrapers on Apify marketplace | Pre-built scrapers available for Apollo Duck and other marine sites. Pay-per-use. Can save development time for Tier 3 sites. |

**Priority: APPLY FOR ACCESS IN MONTH 2 (parallel with Tier 2-3 scraping)**

---

## TIER 5 — Future Expansion (Boat Parts, Equipment, Services)

These websites are not boat listings but are relevant for NauticFinder.ai's future expansion into boat parts, marine equipment, marinas, and nautical services.

| # | Website | URL | Category | Notes |
|---|---------|-----|----------|-------|
| 48 | West Marine | https://www.westmarine.com | Parts & Equipment | Largest marine supply retailer. Pricing data for parts comparison. |
| 49 | Defender Marine | https://www.defender.com | Parts & Equipment | Major marine supply retailer. Competitive pricing. |
| 50 | Boats.net | https://www.boats.net | OEM Parts | Marine OEM parts. Engine parts, propellers, accessories. |
| 51 | MarineEngine.com | https://www.marineengine.com | Engines & Parts | Marine engine parts and accessories marketplace. |
| 52 | Sailing Chandlery | https://www.sailingchandlery.com | Sailing Equipment | Specialist sailing equipment retailer. |
| 53 | Force4 Chandlery | https://www.force4.co.uk | Chandlery | UK-based marine chandlery. |
| 54 | Jimmy Green Marine | https://www.jimmygreen.co.uk | Rigging & Rope | Specialist sailing rigging and rope. |
| 55 | Navionics | https://www.navionics.com | Navigation Charts | Navigation charts and boating app. Useful for route/area data. |
| 56 | ActiveCaptain | https://activecaptain.garmin.com | Marinas & Anchorages | Marina reviews, anchorage information. Community-driven. |
| 57 | Marinas.com | https://www.marinas.com | Marina Directory | Marina listings and availability. |
| 58 | Dockwa | https://dockwa.com | Marina Booking | Marina reservation platform. |
| 59 | Noonsite | https://www.noonsite.com | Cruising Information | Worldwide cruising information, regulations, country guides. Invaluable for offshore/liveaboard features. |
| 60 | PredictWind | https://www.predictwind.com | Weather & Routing | Marine weather forecasting. 5th most visited boats website globally. |

**Priority: PHASE 2 OF THE PRODUCT (after boat search MVP is established)**

---

## Summary by Numbers

| Tier | Sites Count | Estimated Unique Boats | Priority | Timeline |
|------|-------------|----------------------|----------|----------|
| Tier 1 — Boats Group | 3 sites | ~150,000–200,000 | HIGHEST | Week 1-2 |
| Tier 2 — Major Independents | 5 sites | +100,000–130,000 | HIGH | Week 3-4 |
| Tier 3 — Regional & Niche | 34 sites | +50,000–80,000 | MEDIUM | Month 2-3 |
| Tier 4 — MLS/API Feeds | 5 sources | +30,000–50,000 | HIGH (parallel) | Month 2-3 |
| Tier 5 — Future Expansion | 13 sites | N/A (parts, services) | LOW | After MVP |
| **TOTAL** | **60 sources** | **~350,000–450,000 unique boats** | | |

---

## Scraping Execution Order (Recommended)

### Week 1-2: Core Foundation
1. YachtWorld (largest MLS, broker-only, high-quality data)
2. boats.com (largest overall listing count)
3. Boat Trader (largest US marketplace)

### Week 3-4: European & Global Expansion
4. Rightboat (global independent, strong in UK/Europe)
5. Boat24 (Europe's leading marketplace)
6. TheYachtMarket (global independent)

### Month 2: Secondary Coverage
7. Scanboat (Nordic/Northern Europe)
8. YATCO (luxury segment + apply for API access)
9. Apollo Duck (UK, Ireland — important for Dublin base)
10. Boatshop24 (international)
11. Band of Boats (France, Mediterranean)
12. iNautia (Spain, Italy, France)

### Month 2 (Parallel): API Applications
13. Apply for IYBA MLS data feed access
14. Apply for YATCO BOSS API access
15. Contact Boats Group about data partnership

### Month 3: Regional Deep Dive
16. boatsales.com.au (Australia)
17. Botentekoop.nl (Netherlands)
18. Cosasdebarcos.com (Spain)
19. Annonces du Bateau (France)
20. POP Yachts (USA)
21. iBoats (USA)
22. BoatCrazy (USA)
23. DailyBoats (global)
24. TopBoats (Europe)

### Month 3+: AI-Assisted Rapid Expansion
Use the AI-assisted scraper admin tool to rapidly add:
25-42. Individual brokerages (Denison, United Yacht, Fraser, etc.)
Plus any new sites discovered during operation.

### Ongoing: Community Data Enrichment
- The Hull Truth (forum data for boat reviews/reputation)
- Cruiser Forum (real-world owner experiences)
- Sailboatdata.com (technical specifications)
- YachtBuyer (model comparisons and reviews)
