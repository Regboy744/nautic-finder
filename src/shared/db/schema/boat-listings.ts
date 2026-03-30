import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boatModels } from './boat-models.js';
import { brokers } from './brokers.js';
import { customVector } from './custom-types.js';

/**
 * Boat listings table — every scraped boat listing from broker websites.
 * Dynamic data that changes with every scrape pass.
 * Nullable FK to boat_models for enrichment when model is known.
 */
export const boatListings = pgTable(
  'boat_listings',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // -- Model link (nullable — custom boats have no model) --
    modelId: uuid('model_id').references(() => boatModels.id, { onDelete: 'set null' }),

    // -- Listing identity --
    title: text('title'),
    make: text('make'),
    modelName: text('model_name'),
    year: integer('year'),
    boatType: text('boat_type'),
    subtype: text('subtype'),

    // -- Price --
    price: numeric('price'),
    currency: text('currency'),
    priceNormalizedEur: numeric('price_normalized_eur'),
    priceNormalizedUsd: numeric('price_normalized_usd'),

    // -- Location --
    country: text('country'),
    region: text('region'),
    city: text('city'),
    marinaName: text('marina_name'),
    latitude: numeric('latitude'),
    longitude: numeric('longitude'),

    // -- Description & Media --
    description: text('description'),
    features: text('features')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    imageUrls: text('image_urls')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    imageCount: integer('image_count').default(0).notNull(),

    // -- Listing-specific specs (may differ from model) --
    lengthFt: numeric('length_ft'),
    beamFt: numeric('beam_ft'),
    draftFt: numeric('draft_ft'),
    displacementLbs: numeric('displacement_lbs'),
    hullMaterial: text('hull_material'),
    engineMake: text('engine_make'),
    engineModel: text('engine_model'),
    engineHp: integer('engine_hp'),
    engineHours: integer('engine_hours'),
    engineYear: integer('engine_year'),
    fuelType: text('fuel_type'),
    driveType: text('drive_type'),
    cabins: integer('cabins'),
    berths: integer('berths'),
    heads: integer('heads'),
    fuelCapacityL: numeric('fuel_capacity_l'),
    waterCapacityL: numeric('water_capacity_l'),

    // -- AI-generated fields --
    conditionAnalysis: text('condition_analysis'),
    conditionScore: integer('condition_score'),
    beginnerScore: integer('beginner_score'),
    useCaseTags: jsonb('use_case_tags').$type<string[]>(),
    safetyNotes: text('safety_notes'),
    summaryEn: text('summary_en'),
    priceAssessment: text('price_assessment').$type<
      'fair' | 'overpriced' | 'bargain' | null
    >(),
    priceDeltaPct: numeric('price_delta_pct'),

    // -- Broker info --
    brokerId: uuid('broker_id').references(() => brokers.id, { onDelete: 'set null' }),
    brokerName: text('broker_name'),
    brokerPhone: text('broker_phone'),
    brokerEmail: text('broker_email'),
    brokerWebsite: text('broker_website'),
    isPrivateSale: boolean('is_private_sale').default(false).notNull(),

    // -- Source tracking --
    sourceUrl: text('source_url'),
    sourcePlatform: text('source_platform'),
    externalId: text('external_id'),
    fingerprint: text('fingerprint'),

    // -- Embeddings --
    embedding: customVector('embedding', { dimensions: 1536 }),
    embeddingText: text('embedding_text'),

    // -- Timestamps --
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
    priceChangedAt: timestamp('price_changed_at', { withTimezone: true }),

    // -- Status --
    isActive: boolean('is_active').default(true).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),

    // -- Metadata --
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('listings_boat_type_idx').on(table.boatType),
    index('listings_price_eur_idx').on(table.priceNormalizedEur),
    index('listings_year_idx').on(table.year),
    index('listings_country_idx').on(table.country),
    index('listings_make_idx').on(table.make),
    index('listings_length_ft_idx').on(table.lengthFt),
    index('listings_is_active_idx').on(table.isActive),
    index('listings_type_price_active_idx').on(
      table.boatType,
      table.priceNormalizedEur,
      table.isActive,
    ),
    index('listings_fingerprint_idx').on(table.fingerprint),
    index('listings_source_url_idx').on(table.sourceUrl),
  ],
);
