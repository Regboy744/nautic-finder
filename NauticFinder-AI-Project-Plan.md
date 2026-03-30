# NauticFinder.ai — Complete Project Plan & Architecture

## Project Overview

NauticFinder.ai is an AI-powered nautical search and discovery platform. Instead of traditional listing websites with filters, users interact with a conversational AI chat interface — they describe what they want in plain language, and the AI finds the best matches across hundreds of broker websites worldwide, compares them, analyzes photos for condition issues, checks if prices are fair, and gives personalized recommendations. Designed for everyone, especially beginners who know nothing about boats.

The platform aggregates boat listings from all major broker aggregators (YachtWorld, Boat Trader, Rightboat, Boat24, TheYachtMarket, Scanboat, Apollo Duck, YATCO, boats.com, Boatshop24, Band of Boats, DailyBoats, POP Yachts, iBoats, BoatCrazy, boatsales.com.au, and others), normalizes the data, generates vector embeddings for semantic search, and uses AI to provide intelligent, conversational boat buying advice.

Future expansion will cover boat parts, marine equipment, marinas, marine services, offshore living, and everything nautical.

---

## Architecture Overview

### Architecture Style
- Domain-Driven Design (DDD) with clear bounded contexts
- Microservices architecture — frontend and backend fully separated
- Event-driven communication between services where appropriate
- API-first design — backend exposes RESTful APIs consumed by the frontend

### Bounded Contexts (Domains)

1. **Scraping Domain** — responsible for discovering, extracting, and normalizing boat data from external broker websites
2. **Catalog Domain** — responsible for storing, deduplicating, and managing the normalized boat inventory
3. **Search Domain** — responsible for SQL filtering, vector/semantic search, and search result ranking
4. **AI Domain** — responsible for all AI interactions: filter extraction, reasoning, condition analysis, embeddings
5. **User Domain** — responsible for user accounts, authentication, preferences, and saved boats
6. **Notification Domain** — responsible for alerts, emails, push notifications when new matching boats appear
7. **Conversation Domain** — responsible for chat history, session management, and conversation context
8. **Analytics Domain** — responsible for tracking user behavior, popular searches, and platform metrics

---

## Tech Stack

### Frontend (Separate Repository)
- **Framework**: Vue 3 with Composition API
- **Meta-framework**: Nuxt 3 (for SSR/SEO — critical for organic traffic)
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **HTTP Client**: ofetch (built into Nuxt) or Axios
- **Real-time**: Supabase Realtime client (for live notifications)
- Email provider: Resend
- **Deployment**:Netlify

### Backend (Separate Repository)
- **Runtime**: Node.js (LTS)
- **Framework**: Fastify (Fastify preferred for performance)
- **Language**: Typescript (ES Modules)
- **API Style**: RESTful with versioned endpoints (e.g., /api/v1/)
- **Validation**: Zod for request/response schema validation
- **Authentication**: Supabase Auth (JWT-based)
- Email provider: Resend
- **Task Queue**: BullMQ with Redis for background jobs (scraping, embeddings, notifications)
- **Logging**: Pino (structured JSON logging)
- **Deployment**: Railway, Render, or DigitalOcean App Platform

### Database
- **Primary Database**: Supabase (PostgreSQL)
- **Vector Extension**: pgvector (for embedding storage and semantic search)
- **ORM/Query Builder**: Prisma or Drizzle ORM (Drizzle preferred for performance and pgvector support)
- **Cache**: Redis (Upstash for serverless, or self-hosted)
- **Migrations**: Managed through the ORM migration system
- For the data collection plan, field and some other info, look at the  /home/regboy/coding/nauticFinder/backend/datacollectionplan.md, not all data will be available in all websites,
so , we need to be aware about that. 


### AI Services
- **Filter Extraction (Step 0)**: Google Gemini 2.0 Flash (free tier) — extracts structured JSON filters from natural language
- **Embeddings (Step 2)**: OpenAI text-embedding-3-small (cheap) or Ollama with nomic-embed-text (free, self-hosted)
- **Reasoning & Response (Step 4)**: Gemini Flash for basic queries, Claude Sonnet for complex comparisons and image analysis
- **Image/Condition Analysis**: Claude Vision or Gemini Vision — run at scrape time, store results as text

### Scraping
- **Browser Automation**: Playwright (for JavaScript-rendered pages)
- **HTML Parsing**: Cheerio (for static HTML pages)
- **Job Scheduling**: BullMQ with Redis (manages scraping queues, retries, rate limiting)
- **Proxy Management**: Rotating proxies for avoiding rate limits (BrightData, ScraperAPI, or similar)
- **AI-Assisted Selector Generation**: Send sample HTML to Claude/Gemini to auto-generate CSS selectors for new broker sites

### Notifications
- **Email**: Resend (developer-friendly) or SendGrid
- **Push**: Web Push API
- **Optional**: WhatsApp via Twilio (popular in European boat market)

### Monitoring & DevOps
- **Error Tracking**: Sentry
- **Monitoring**: Uptime monitoring with BetterUptime or similar
- **CI/CD**: GitHub Actions
- **Containerization**: Docker for local development and deployment consistency

---

## Database Schema Design

### Core Tables

**brokers** — the external websites being scraped
- id (uuid, primary key)
- name (text) — e.g., "YachtWorld"
- website (text) — base URL
- scraper_type (text) — "playwright" or "cheerio"
- scraper_config (jsonb) — CSS selectors, pagination rules, rate limits
- scraping_schedule (text) — cron expression for how often to scrape
- last_scraped_at (timestamptz)
- total_boats (integer) — count of active boats from this broker
- is_active (boolean)
- created_at, updated_at (timestamptz)

**boats** — the main inventory table, every scraped boat listing
- id (uuid, primary key)
- title (text)
- manufacturer (text)
- model (text)
- year (integer)
- type (text) — "sail", "motor", "catamaran", "fishing", "jetski", "rib", "dinghy", "trawler"
- subtype (text) — more specific categorization
- length_ft (numeric)
- beam_ft (numeric)
- draft_ft (numeric)
- displacement_kg (numeric)
- hull_material (text) — "fiberglass", "aluminum", "wood", "steel", "composite"
- engine_type (text) — "diesel", "gasoline", "outboard", "inboard", "electric", "sail"
- engine_make (text)
- engine_model (text)
- engine_hp (integer)
- engine_hours (integer)
- fuel_capacity_l (numeric)
- water_capacity_l (numeric)
- cabins (integer)
- berths (integer)
- heads (integer)
- price (numeric)
- currency (text) — "EUR", "USD", "GBP", etc.
- price_normalized_eur (numeric) — all prices converted to EUR for comparison
- country (text)
- region (text)
- city (text)
- latitude (numeric)
- longitude (numeric)
- description (text) — full listing description
- features (text[]) — array of features like "bow thruster", "autopilot", "radar"
- image_urls (text[]) — array of photo URLs from broker site
- image_count (integer)
- condition_analysis (text) — AI-generated from photos, filled at scrape time
- condition_score (integer) — 1-10, AI-generated
- beginner_friendly (boolean) — AI-assessed
- broker_id (uuid, FK to brokers)
- broker_name (text) — seller/broker company name
- broker_phone (text)
- broker_email (text)
- broker_website (text)
- source_url (text) — original listing URL on broker site
- fingerprint (text) — deduplication hash: "manufacturer-model-year-length"
- embedding (vector(1536)) — pgvector column for semantic search
- embedding_text (text) — the text that was used to generate the embedding
- first_seen_at (timestamptz)
- last_seen_at (timestamptz)
- last_checked_at (timestamptz)
- price_changed_at (timestamptz)
- is_active (boolean) — false when listing is removed from broker site
- is_featured (boolean) — for monetization: featured/promoted boats
- created_at, updated_at (timestamptz)

**price_history** — tracks every price change for trend analysis
- id (uuid, primary key)
- boat_id (uuid, FK to boats)
- price (numeric)
- currency (text)
- price_normalized_eur (numeric)
- recorded_at (timestamptz)

**boat_images_analysis** — detailed per-image AI analysis
- id (uuid, primary key)
- boat_id (uuid, FK to boats)
- image_url (text)
- image_order (integer) — position in the gallery
- analysis (text) — AI-generated description of what's in the image
- issues_found (text[]) — e.g., ["gelcoat crazing", "sail UV damage"]
- area_analyzed (text) — "hull", "deck", "interior", "engine", "sails"
- condition_score (integer) — 1-10 for this specific image
- analyzed_at (timestamptz)
- ai_model_used (text) — which model performed the analysis

**users** — platform users
- id (uuid, primary key)
- email (text, unique)
- name (text)
- avatar_url (text)
- experience_level (text) — "beginner", "intermediate", "expert"
- preferences (jsonb) — budget range, preferred types, regions, features
- notification_settings (jsonb) — email frequency, push enabled, etc.
- created_at, updated_at (timestamptz)

**saved_boats** — boats the user is watching/tracking
- id (uuid, primary key)
- user_id (uuid, FK to users)
- boat_id (uuid, FK to boats)
- notes (text) — user's personal notes about this boat
- created_at (timestamptz)
- unique constraint on (user_id, boat_id)

**search_alerts** — automated notifications for matching criteria
- id (uuid, primary key)
- user_id (uuid, FK to users)
- name (text) — user's label for this alert
- filters (jsonb) — structured filters: { type, maxPrice, minLength, region, etc. }
- keywords (text) — semantic search keywords
- keywords_embedding (vector(1536)) — pre-computed embedding of the keywords
- frequency (text) — "instant", "daily", "weekly"
- is_active (boolean)
- last_notified_at (timestamptz)
- created_at (timestamptz)

**conversations** — chat sessions between user and AI
- id (uuid, primary key)
- user_id (uuid, FK to users)
- title (text) — auto-generated summary of the conversation
- messages (jsonb[]) — array of { role: "user"|"assistant", content, timestamp, boats_referenced[] }
- search_context (jsonb) — filters and results from the most recent search in this conversation
- created_at, updated_at (timestamptz)

**market_stats** — aggregated market data for price comparison
- id (uuid, primary key)
- manufacturer (text)
- model (text)
- year_range (text) — e.g., "2015-2020"
- avg_price_eur (numeric)
- median_price_eur (numeric)
- min_price_eur (numeric)
- max_price_eur (numeric)
- sample_count (integer)
- last_calculated_at (timestamptz)

### Database Indexes

- boats: type, price_normalized_eur, year, country, manufacturer, length_ft, is_active
- boats: composite index on (type, price_normalized_eur, is_active) — most common filter combination
- boats: fingerprint — for deduplication lookups
- boats: source_url — for update checks
- boats: HNSW index on embedding column using vector_cosine_ops — for semantic search
- price_history: (boat_id, recorded_at)
- saved_boats: (user_id, boat_id)
- search_alerts: (user_id, is_active)
- market_stats: (manufacturer, model)

---

## Microservices Architecture

### Service 1: Scraping Service
**Responsibility**: Discovers, extracts, and normalizes boat data from external websites.
**Domain**: Scraping Domain
**Tech**: Node.js + Playwright + Cheerio + BullMQ
**Communication**: Writes directly to the Catalog Domain's database. Publishes events to Redis for "new boat found" and "price changed."
**Key Components**:
- Scraper Engine — manages browser instances, handles retries, respects rate limits
- Selector Registry — stores CSS selectors per broker site, supports AI-assisted generation
- Data Normalizer — cleans raw scraped data into consistent format (currency conversion, unit conversion, text cleaning)
- Deduplication Engine — generates fingerprints, detects same boat across multiple brokers, merges data from multiple sources
- Scheduler — BullMQ-based cron jobs for periodic re-scraping of each broker
- Health Monitor — tracks scraper success rates, detects when a broker site changes layout

### Service 2: Catalog Service (API)
**Responsibility**: Manages the boat inventory, handles CRUD operations, deduplication, price tracking.
**Domain**: Catalog Domain
**Tech**: Node.js + Fastify + Drizzle ORM + Supabase
**Endpoints**:
- GET /api/v1/boats — list boats with filters (paginated)
- GET /api/v1/boats/:id — single boat details with full data
- GET /api/v1/boats/:id/price-history — price changes over time
- GET /api/v1/boats/:id/similar — similar boats based on embedding distance
- GET /api/v1/brokers — list of broker sources
- GET /api/v1/market-stats — aggregated market data for price comparison
- Internal endpoints for the scraping service to create/update boats

### Service 3: Search Service
**Responsibility**: Handles all search operations — SQL filtering, vector/semantic search, result ranking and scoring.
**Domain**: Search Domain
**Tech**: Node.js + Fastify + pgvector + Redis (for caching search results)
**Endpoints**:
- POST /api/v1/search — accepts structured filters + keywords, returns ranked boats
- POST /api/v1/search/semantic — accepts embedding vector, returns closest boats
- GET /api/v1/search/suggestions — auto-complete and search suggestions
**Key Components**:
- Filter Builder — dynamically constructs SQL WHERE clauses from structured filters
- Vector Search Engine — performs pgvector similarity search on pre-filtered results
- Result Scorer — applies business logic scoring (photo count, listing freshness, condition score, data completeness)
- Result Cache — stores top 200 results per session in Redis for pagination

### Service 4: AI Service
**Responsibility**: All AI model interactions — filter extraction, embedding generation, reasoning, image analysis.
**Domain**: AI Domain
**Tech**: Node.js + Fastify + AI SDKs (Google Generative AI, Anthropic, OpenAI)
**Endpoints**:
- POST /api/v1/ai/extract-filters — takes natural language, returns structured JSON filters
- POST /api/v1/ai/generate-embedding — takes text, returns vector embedding
- POST /api/v1/ai/reason — takes boats + user message, returns conversational AI response
- POST /api/v1/ai/analyze-image — takes image URL, returns condition analysis
- POST /api/v1/ai/compare — takes multiple boats, returns detailed comparison
**Key Components**:
- Model Router — selects the right AI model based on task complexity (Gemini Flash for simple, Claude for complex)
- System Prompt Manager — maintains and versions the boat expert system prompt with all domain knowledge
- Token Budget Manager — tracks token usage and costs per query
- Topic Guard — validates that user messages are on-topic (nautical) before incurring AI costs
- Rate Limiter — prevents abuse and controls AI API costs

### Service 5: User Service
**Responsibility**: User accounts, authentication, preferences, saved boats.
**Domain**: User Domain
**Tech**: Node.js + Fastify + Supabase Auth
**Endpoints**:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/users/me — current user profile
- PUT /api/v1/users/me/preferences
- GET /api/v1/users/me/saved-boats
- POST /api/v1/users/me/saved-boats
- DELETE /api/v1/users/me/saved-boats/:id
- GET /api/v1/users/me/alerts
- POST /api/v1/users/me/alerts
- PUT /api/v1/users/me/alerts/:id
- DELETE /api/v1/users/me/alerts/:id

### Service 6: Notification Service
**Responsibility**: Sends emails, push notifications, and alerts when new matching boats appear.
**Domain**: Notification Domain
**Tech**: Node.js + BullMQ + Resend (email) + Web Push API
**Key Components**:
- Alert Matcher — when a new boat is added, checks against all active search alerts
- Notification Queue — BullMQ queue for sending notifications with retry logic
- Email Templates — pre-built templates for new listing alerts, price drop alerts, weekly digests
- Delivery Tracker — tracks which notifications were sent, opened, clicked

### Service 7: Conversation Service
**Responsibility**: Manages chat sessions, stores conversation history, maintains context.
**Domain**: Conversation Domain
**Tech**: Node.js + Fastify + Supabase
**Endpoints**:
- GET /api/v1/conversations — list user's conversations
- POST /api/v1/conversations — start new conversation
- GET /api/v1/conversations/:id — get full conversation with messages
- POST /api/v1/conversations/:id/messages — send a message (triggers the full AI pipeline)
- DELETE /api/v1/conversations/:id

### Service 8: Gateway / BFF (Backend for Frontend)
**Responsibility**: Single entry point for the frontend. Routes requests to appropriate microservices. Handles authentication middleware, rate limiting, and request validation.
**Domain**: Cross-cutting
**Tech**: Node.js + Fastify
**Key Responsibilities**:
- JWT validation on every request
- Rate limiting per user
- Request routing to internal services
- Response aggregation (combine data from multiple services into one response)
- API versioning

---

## The AI Chat Pipeline (Detailed Flow)

When a user sends a message in the chat, this is the complete flow across services:

### Step 0: Topic Validation
- **Who**: AI Service (Topic Guard)
- **What**: Quick keyword check to ensure the message is nautical-related
- **If off-topic**: Return a friendly redirect message without incurring any AI API costs
- **If on-topic**: Continue to Step 1

### Step 1: Filter Extraction
- **Who**: AI Service (Model Router → Gemini Flash)
- **What**: Send the user's natural language message to Gemini Flash with a structured prompt
- **Input**: "I want a family sailboat under €40k, easy to handle"
- **Output**: JSON object: { type: "sail", maxPrice: 40000, keywords: "family easy to handle beginner friendly" }
- **Cost**: Free (Gemini free tier)
- **Speed**: ~500ms

### Step 2: SQL Pre-filtering
- **Who**: Search Service (Filter Builder)
- **What**: Build a dynamic SQL query using only the non-null filters from Step 1
- **Input**: { type: "sail", maxPrice: 40000 }
- **Output**: Array of boat IDs that match hard filters (e.g., 18,000 boats)
- **Cost**: Free (database query)
- **Speed**: ~20ms

### Step 3: Embedding Generation
- **Who**: AI Service (Embedding Generator)
- **What**: Convert ONLY the user's keywords into a vector embedding
- **Input**: "family easy to handle beginner friendly"
- **Output**: [0.023, -0.041, 0.089, ...] (1536 numbers)
- **Cost**: ~$0.00001
- **Speed**: ~5ms
- **Important**: The boats' embeddings are already pre-computed and stored in the database from scrape time. Only the user's short prompt is converted here.

### Step 4: Semantic Vector Search
- **Who**: Search Service (Vector Search Engine)
- **What**: Compare the user's embedding against the pre-stored embeddings of the pre-filtered boats
- **Input**: User embedding + array of pre-filtered boat IDs
- **Output**: Top 30-50 boats ranked by semantic relevance
- **Cost**: Free (math calculation in pgvector)
- **Speed**: ~30ms

### Step 5: Result Scoring & Ranking
- **Who**: Search Service (Result Scorer)
- **What**: Apply business logic scoring on top of vector relevance
- **Scoring factors**: photo count (more photos = more trustworthy), listing freshness (newer = better), condition score (higher = better), data completeness (more fields filled = better), vector distance (closer = more relevant)
- **Output**: Top 30 boats, re-ranked by combined score
- **Cache**: Store top 200 results in Redis for pagination in follow-up messages

### Step 6: AI Reasoning & Response Generation
- **Who**: AI Service (Model Router → Claude Sonnet or Gemini Flash)
- **What**: Send the top 30 boats + user's message + conversation history + system prompt to the AI
- **The AI**: Reads all 30 boats, selects the top 3-5, explains why each is a good match, flags condition concerns from pre-analyzed photos, assesses price fairness using market stats, writes everything in beginner-friendly language
- **Cost**: ~$0.01-0.03 per query
- **Speed**: ~2-3 seconds

### Step 7: Response Delivery
- **Who**: Conversation Service + Gateway
- **What**: Store the AI response in conversation history, return to frontend
- **Frontend renders**: AI text + boat cards with photos + comparison data + action buttons (save, compare, contact broker)

### Total pipeline time: ~3-4 seconds
### Total cost per query: ~$0.01-0.04

---

## Embedding Pipeline (Background Process)

This runs separately from user queries. It happens when scrapers add or update boats.

### When a New Boat is Scraped:
1. Scraping Service extracts raw data from broker website
2. Data Normalizer cleans and structures the data
3. Deduplication Engine checks fingerprint against existing boats
4. If new: insert into boats table. If existing: update fields that changed.
5. Generate rich embedding text by combining: title + type + length + year + description + features + condition + location
6. Send embedding text to AI Service → Embedding Generator
7. Receive vector embedding (1536 numbers)
8. Store embedding in the boat's row in pgvector column
9. If price changed: insert new row in price_history table
10. Publish "new_boat" or "price_changed" event to Redis
11. Notification Service picks up the event and checks against search alerts

### When a Boat's Photos Are Scraped:
1. For each image URL, send to AI Service → Image Analyzer
2. AI returns condition analysis text + issues found + condition score
3. Store in boat_images_analysis table
4. Update the boat's overall condition_analysis and condition_score
5. Update the boat's embedding (re-generate with new condition data included)

---

## Scraping Strategy

### Phase 1 — Aggregator Scraping (Month 1)
Build scrapers for the top 6 aggregator platforms. These cover approximately 80-90% of all boats for sale worldwide.

**Priority order**:
1. YachtWorld (~80,000 listings, largest broker MLS)
2. boats.com (~120,000 listings, same parent company as YachtWorld)
3. Boat Trader (~108,000 listings, same parent company)
4. Rightboat (~50,000+ listings, global independent)
5. Boat24 (~34,000 listings, strongest in Europe)
6. TheYachtMarket (~50,000+ listings, global independent)

**Expected unique boats after deduplication**: ~150,000-250,000

### Phase 2 — Secondary Aggregators (Month 2)
7. Scanboat (~14,000, strong Nordic/Northern Europe)
8. YATCO (~15,000, luxury/high-end yachts, potential API access)
9. Apollo Duck (UK, Ireland, Europe — important for Dublin base)
10. Boatshop24 (international, shares some inventory with Boat24)
11. Band of Boats (~7,000, France/Mediterranean focus)
12. DailyBoats (global variety)

**Expected total unique boats**: ~300,000-350,000

### Phase 3 — Regional & Niche (Month 3)
13. boatsales.com.au (Australia — 3rd most visited boats website globally)
14. POP Yachts (USA, performance-based broker)
15. iBoats (USA, community + listings)
16. BoatCrazy (USA, private sellers + dealers)
17. MarineMax (USA, major dealer network)
18. TopBoats (Europe)

**Expected total unique boats**: ~400,000+

### Phase 4 — MLS Data Feeds (Month 2-3, parallel)
Apply for structured API access:
- IYBA MLS Feed (REST JSON API)
- YATCO BOSS API
These provide clean, structured data without scraping.

### Phase 5 — AI-Assisted Rapid Expansion (Month 3+)
Build an admin tool that:
1. Takes a broker website URL as input
2. Fetches a sample listing page
3. Sends the HTML to Claude/Gemini to auto-generate CSS selectors
4. Runs a test scrape of 10 boats for verification
5. On approval, adds the broker to the production scraping queue

This reduces per-broker setup time from hours to minutes, enabling rapid addition of individual brokers.

### Scraper Architecture Best Practices
- Each broker has its own config file with selectors, pagination rules, and rate limits
- Respect robots.txt and implement polite crawling (delays between requests)
- Use rotating proxies to avoid IP blocking
- Implement retry logic with exponential backoff for failed requests
- Store raw HTML snapshots for debugging and re-parsing if selectors change
- Monitor scraper health: success rate, data quality, selector breakage detection
- Run scrapers on a schedule: major aggregators every 4-6 hours, smaller sites every 12-24 hours

### Deduplication Strategy
- Generate fingerprint from: lowercase(manufacturer) + lowercase(model) + year + round(length_ft)
- When fingerprint matches existing boat: merge data, taking the most complete/recent values from each source
- Track all source URLs per boat to know which brokers list it
- Use the lowest current price across sources as the canonical price
- Flag boats that appear on many brokers (more exposure = likely motivated seller)

---

## Data Normalization Rules

### Price Normalization
- Convert all prices to EUR using daily exchange rates (free API: exchangerate-api.com)
- Store both original price + currency AND normalized EUR price
- Handle "Price on Application" / "POA" — store as null, flag for the AI to mention

### Length Normalization
- Convert all measurements to feet (primary) and store meters as secondary
- Handle formats: "34ft", "34'", "10.4m", "34 feet", "10,4 m"

### Type Normalization
- Map broker-specific categories to standard types: "sail", "motor", "catamaran", "fishing", "jetski", "rib", "dinghy", "trawler", "houseboat", "commercial"
- Handle edge cases: "sloop" → "sail", "cruiser" → "motor", "sportfish" → "fishing"

### Location Normalization
- Standardize country names to ISO codes
- Extract city/region from free-text location fields
- Optionally geocode to lat/long for distance-based search

### Feature Extraction
- Parse description text to extract features into the features array
- Look for: bow thruster, autopilot, radar, GPS, chart plotter, windlass, davits, solar panels, generator, watermaker, air conditioning, heating, dinghy, outboard, roller furling, in-mast furling, lazy jacks, bimini, dodger, sprayhood

---

## Frontend Architecture

### Pages
- **Home / Landing** — hero section with chat input, value proposition, example queries
- **Chat** — the main conversational interface, full-screen chat with boat cards rendered inline
- **Boat Detail** — full page for a single boat with all specs, photos, condition analysis, price history chart, similar boats, broker contact
- **Compare** — side-by-side comparison of 2-3 boats selected by the user
- **Saved Boats** — user's watchlist with price change indicators
- **Alerts** — manage search alerts
- **Profile / Settings** — user preferences, notification settings
- **Auth** — login / register pages

### Key Frontend Components
- ChatInterface — the main chat window with message bubbles
- ChatInput — text input with suggestion chips below
- BoatCard — compact boat display used inline in chat responses (photo, title, price, key specs, condition badge)
- BoatGrid — grid/list view of boat results
- BoatDetail — full boat information page
- ComparisonTable — side-by-side boat comparison
- PriceHistoryChart — line chart showing price over time
- ConditionBadge — visual indicator of boat condition (1-10 score with color)
- ImageGallery — photo gallery with AI condition annotations
- SearchSuggestions — suggested queries shown when chat is empty
- AlertForm — create/edit search alert form
- BrokerContactCard — broker info with call/email buttons

### Frontend Best Practices
- Mobile-first responsive design (many users will browse on phones at marinas and boat shows)
- Lazy load images (boat photos are heavy)
- Implement skeleton loading states for chat responses (streaming feel)
- Use Nuxt SSR for landing page and boat detail pages (SEO critical)
- Use client-side rendering for the chat interface (real-time interaction)
- Implement infinite scroll for search results
- Add share functionality for boat detail pages (users share listings with partners/family)

---

## System Prompt — Boat Expert Knowledge

The AI system prompt is a critical part of the product. It contains all the domain expertise that makes the AI a "boat expert." This prompt should be versioned, maintained, and continuously improved.

### Core System Prompt Structure
1. **Identity**: "You are NauticFinder AI, a specialized nautical expert and boat advisor."
2. **Scope Limitation**: Only respond to nautical/marine topics. Redirect off-topic questions.
3. **Tone**: Friendly, knowledgeable, approachable. Explain technical terms simply. Never condescending.
4. **Boat Knowledge Base**: Embedded expertise about comfort indicators, safety features, beginner suitability, price fairness rules, condition red flags, hull materials pros/cons, engine types, popular manufacturers by category.
5. **Response Format Instructions**: When to show boat cards, when to ask clarifying questions, when to compare, how to flag concerns.
6. **Behavioral Rules**: If query is too broad (many results), ask clarifying questions. Always mention if a price seems unfair. Always flag condition concerns. Always indicate beginner suitability. Never invent data — only use what's provided from the database.

---

## Development Phases

### Phase 1 — Foundation & Data (Weeks 1-4)
**Goal**: Database running, first scraper working, real data flowing in.

- Set up Supabase project with full schema and pgvector extension
- Set up backend project structure (Fastify + Drizzle ORM)
- Build the Scraping Service with the reusable scraper template
- Build the first scraper for YachtWorld
- Build the Data Normalizer
- Build the Deduplication Engine
- Set up BullMQ with Redis for job scheduling
- Run the first scrape and populate the database with real boats
- Build basic Catalog Service API endpoints (list boats, get boat details)
- Set up CI/CD pipeline with GitHub Actions

### Phase 2 — Search & Embeddings (Weeks 5-6)
**Goal**: Semantic search working, boats are searchable by meaning.

- Integrate embedding generation (OpenAI or Ollama)
- Build the embedding pipeline: generate embeddings for all existing boats
- Build the Search Service with SQL filtering + pgvector semantic search
- Build the Result Scorer with business logic ranking
- Implement Redis caching for search results
- Add 2-3 more scrapers (boats.com, Boat Trader, Rightboat)
- Test search quality with various natural language queries

### Phase 3 — AI Pipeline (Weeks 7-8)
**Goal**: The full AI chat pipeline working end-to-end.

- Build the AI Service with filter extraction (Gemini Flash)
- Build the reasoning endpoint (Claude/Gemini for response generation)
- Build the Topic Guard (keyword pre-check + AI enforcement)
- Build the System Prompt with boat expertise
- Build the Conversation Service for chat history
- Wire up the full pipeline: message → filters → SQL → embedding → vector search → scoring → AI reasoning → response
- Test with real conversations and iterate on system prompt

### Phase 4 — Frontend (Weeks 9-12)
**Goal**: Beautiful, functional chat interface users can interact with.

- Set up Nuxt 3 project with Tailwind CSS
- Build the landing page with hero chat input
- Build the ChatInterface component with message rendering
- Build BoatCard components for inline results
- Build the Boat Detail page with full specs, photos, condition
- Build the ComparisonTable for side-by-side comparison
- Build authentication flow (register, login, profile)
- Build the Saved Boats and Alerts pages
- Implement responsive design for mobile
- Connect frontend to all backend API endpoints
- Deploy frontend to Vercel

### Phase 5 — Image Analysis & Condition (Weeks 13-14)
**Goal**: AI photo analysis running on all boats.

- Build the image analysis pipeline in the AI Service
- Process existing boat photos through Claude/Gemini Vision
- Store condition analysis per image in boat_images_analysis table
- Update boat-level condition scores
- Display condition analysis and annotations in the frontend
- Re-generate embeddings with condition data included

### Phase 6 — Notifications & Alerts (Weeks 15-16)
**Goal**: Users get notified about new matching boats.

- Build the Notification Service
- Build the Alert Matcher (checks new boats against saved alerts)
- Build email templates for listing alerts and price drop alerts
- Implement Web Push notifications
- Build the alerts management UI in the frontend
- Test end-to-end: new boat scraped → matches alert → user notified

### Phase 7 — Scaling & Polish (Weeks 17-20)
**Goal**: More data, more features, production-ready quality.

- Add remaining scrapers (Tier 2 and Tier 3 broker sites)
- Build the AI-assisted scraper admin tool for rapid broker addition
- Apply for MLS data feed access (IYBA, YATCO)
- Build the PriceHistoryChart and market comparison features
- Add the live web search hybrid layer (Tavily/Brave for supplemental data)
- Performance optimization: query tuning, caching, CDN for images
- Security audit: input sanitization, rate limiting, authentication hardening
- Error monitoring with Sentry
- Load testing with expected user volumes

### Phase 8 — Launch & Growth (Week 20+)
**Goal**: Public launch, user acquisition, iteration.

- Soft launch with beta users (boating communities, forums, Reddit)
- Gather feedback and iterate on AI response quality
- SEO optimization for boat detail pages (long-tail keywords)
- Content marketing: "best sailboats under €50k" type articles generated from your data
- Monitor and improve scraper health and data quality
- Explore monetization: featured listings, premium features, broker partnerships

---

## Project Repository Structure

### Backend Repository (nauticfinder-api)
```
nauticfinder-api/
├── docker-compose.yml
├── package.json
├── .env.example
├── src/
│   ├── gateway/                  # API Gateway / BFF
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validation.js
│   │   └── config/
│   │
│   ├── services/
│   │   ├── catalog/              # Catalog Service
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── repositories/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   │
│   │   ├── search/               # Search Service
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── filterBuilder.js
│   │   │   ├── vectorSearch.js
│   │   │   ├── resultScorer.js
│   │   │   └── searchCache.js
│   │   │
│   │   ├── ai/                   # AI Service
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── providers/
│   │   │   │   ├── gemini.js
│   │   │   │   ├── claude.js
│   │   │   │   └── ollama.js
│   │   │   ├── modelRouter.js
│   │   │   ├── topicGuard.js
│   │   │   ├── systemPrompt.js
│   │   │   └── embeddingGenerator.js
│   │   │
│   │   ├── user/                 # User Service
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── repositories/
│   │   │
│   │   ├── conversation/         # Conversation Service
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── repositories/
│   │   │
│   │   └── notification/         # Notification Service
│   │       ├── alertMatcher.js
│   │       ├── emailSender.js
│   │       ├── pushSender.js
│   │       ├── templates/
│   │       └── queue/
│   │
│   ├── scraping/                 # Scraping Service
│   │   ├── engine/
│   │   │   ├── scraperBase.js
│   │   │   ├── playwrightScraper.js
│   │   │   └── cheerioScraper.js
│   │   ├── brokers/              # One config per broker
│   │   │   ├── yachtworld.js
│   │   │   ├── boattrader.js
│   │   │   ├── rightboat.js
│   │   │   ├── boat24.js
│   │   │   ├── theyachtmarket.js
│   │   │   └── scanboat.js
│   │   ├── normalizer/
│   │   │   ├── priceNormalizer.js
│   │   │   ├── lengthNormalizer.js
│   │   │   ├── typeNormalizer.js
│   │   │   ├── locationNormalizer.js
│   │   │   └── featureExtractor.js
│   │   ├── deduplication/
│   │   │   ├── fingerprint.js
│   │   │   └── merger.js
│   │   ├── embedding/
│   │   │   ├── textBuilder.js
│   │   │   └── embeddingPipeline.js
│   │   ├── imageAnalysis/
│   │   │   └── conditionAnalyzer.js
│   │   ├── scheduler/
│   │   │   └── cronJobs.js
│   │   └── monitor/
│   │       └── healthChecker.js
│   │
│   ├── shared/                   # Shared utilities across services
│   │   ├── db/
│   │   │   ├── client.js
│   │   │   ├── schema.js         # Drizzle schema definitions
│   │   │   └── migrations/
│   │   ├── redis/
│   │   │   └── client.js
│   │   ├── logger.js
│   │   ├── errors.js
│   │   └── constants.js
│   │
│   └── config/
│       ├── database.js
│       ├── redis.js
│       ├── ai.js
│       └── scraping.js
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── scripts/
    ├── seed.js                   # Seed database with test data
    ├── generateEmbeddings.js     # Batch generate embeddings for all boats
    ├── runScraper.js             # Manually trigger a specific scraper
    └── analyzeImages.js          # Batch run image analysis
```

### Frontend Repository (nauticfinder-web)
```
nauticfinder-web/
├── nuxt.config.ts
├── tailwind.config.js
├── package.json
├── app.vue
├── pages/
│   ├── index.vue                 # Landing page with hero chat
│   ├── chat/
│   │   └── [id].vue             # Chat conversation page
│   ├── boats/
│   │   ├── index.vue            # Browse/search results
│   │   └── [id].vue             # Boat detail page
│   ├── compare.vue               # Side-by-side comparison
│   ├── saved.vue                 # Saved boats / watchlist
│   ├── alerts.vue                # Search alerts management
│   ├── auth/
│   │   ├── login.vue
│   │   └── register.vue
│   └── profile.vue               # User settings
│
├── components/
│   ├── chat/
│   │   ├── ChatInterface.vue
│   │   ├── ChatInput.vue
│   │   ├── ChatMessage.vue
│   │   ├── ChatSuggestions.vue
│   │   └── ChatTypingIndicator.vue
│   ├── boat/
│   │   ├── BoatCard.vue
│   │   ├── BoatGrid.vue
│   │   ├── BoatSpecs.vue
│   │   ├── BoatGallery.vue
│   │   ├── BoatConditionBadge.vue
│   │   ├── BoatPriceHistory.vue
│   │   ├── BoatComparisonTable.vue
│   │   └── BoatBrokerContact.vue
│   ├── search/
│   │   ├── SearchBar.vue
│   │   ├── SearchFilters.vue
│   │   └── SearchResults.vue
│   ├── ui/
│   │   ├── BaseButton.vue
│   │   ├── BaseModal.vue
│   │   ├── BaseToast.vue
│   │   └── BaseLoader.vue
│   └── layout/
│       ├── AppHeader.vue
│       ├── AppFooter.vue
│       └── AppSidebar.vue
│
├── composables/
│   ├── useChat.js                # Chat logic and state
│   ├── useBoats.js               # Boat data fetching
│   ├── useSearch.js              # Search logic
│   ├── useAuth.js                # Authentication
│   ├── useAlerts.js              # Search alerts
│   └── useSavedBoats.js          # Saved boats management
│
├── stores/                        # Pinia stores
│   ├── chatStore.js
│   ├── boatStore.js
│   ├── userStore.js
│   └── searchStore.js
│
├── utils/
│   ├── api.js                    # API client configuration
│   ├── formatters.js             # Price, date, length formatters
│   └── constants.js
│
├── assets/
│   └── css/
│       └── main.css              # Global styles, Tailwind imports
│
└── public/
    ├── favicon.ico
    └── images/
```

---

## Environment Variables

### Backend (.env)
```
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                     # Direct PostgreSQL connection string

# Redis
REDIS_URL=

# AI Services
GEMINI_API_KEY=
ANTHROPIC_API_KEY=                # Optional, for Claude
OPENAI_API_KEY=                   # For embeddings

# Scraping
PROXY_URL=                        # Rotating proxy service URL
SCRAPER_USER_AGENT=

# Notifications
RESEND_API_KEY=
WEB_PUSH_VAPID_PUBLIC_KEY=
WEB_PUSH_VAPID_PRIVATE_KEY=

# App
NODE_ENV=
PORT=
JWT_SECRET=
CORS_ORIGIN=                      # Frontend URL
```

### Frontend (.env)
```
NUXT_PUBLIC_API_BASE_URL=         # Backend API URL
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=
```

---

## Key Design Decisions Summary

1. **Frontend and backend are separate repositories** — deployed independently, communicate via REST API
2. **DDD with bounded contexts** — each domain has clear responsibilities and boundaries
3. **Supabase (PostgreSQL + pgvector)** over MongoDB — relational data, vector search in one database
4. **Embeddings are pre-computed at scrape time** — not generated at query time, making search nearly instant
5. **AI image analysis runs at scrape time** — condition data is stored as text, available instantly at query time
6. **Three-layer search pipeline** — SQL filter → vector search → AI reasoning, each layer narrows the results
7. **Hybrid AI model strategy** — Gemini Flash (free) for simple tasks, Claude (paid) for complex reasoning
8. **Topic restriction uses three layers** — frontend UX guidance, keyword pre-check, AI system prompt enforcement
9. **Deduplication by fingerprint** — same boat appearing on multiple brokers is merged into one record
10. **Scraper template pattern** — one reusable engine with per-broker config files, AI-assisted selector generation for rapid expansion
