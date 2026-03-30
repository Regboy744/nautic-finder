import { z } from 'zod';

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

/** UUID path parameter. */
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

/** Pagination + sort query params. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

/** Query params for GET /listings. */
export const listingsQuerySchema = paginationQuerySchema.extend({
  boatType: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  yearMin: z.coerce.number().int().optional(),
  yearMax: z.coerce.number().int().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  lengthMinFt: z.coerce.number().optional(),
  lengthMaxFt: z.coerce.number().optional(),
  hullMaterial: z.string().optional(),
  fuelType: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

/** Body for POST /internal/listings (scraper upsert). */
export const upsertListingBodySchema = z.object({
  externalId: z.string().optional(),
  sourcePlatform: z.string().optional(),
  fingerprint: z.string().optional(),
  title: z.string().optional(),
  make: z.string().optional(),
  modelName: z.string().optional(),
  year: z.number().int().optional(),
  boatType: z.string().optional(),
  subtype: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().optional(),
  priceNormalizedEur: z.string().optional(),
  priceNormalizedUsd: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  marinaName: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
  imageCount: z.number().int().optional(),
  lengthFt: z.string().optional(),
  beamFt: z.string().optional(),
  draftFt: z.string().optional(),
  hullMaterial: z.string().optional(),
  engineMake: z.string().optional(),
  engineModel: z.string().optional(),
  engineHp: z.number().int().optional(),
  engineHours: z.number().int().optional(),
  cabins: z.number().int().optional(),
  berths: z.number().int().optional(),
  heads: z.number().int().optional(),
  brokerId: z.string().uuid().optional(),
  brokerName: z.string().optional(),
  sourceUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

/** Body for PUT /internal/listings/:id. */
export const updateListingBodySchema = upsertListingBodySchema.partial();

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

/** Query params for GET /models. */
export const modelsQuerySchema = paginationQuerySchema.extend({
  make: z.string().optional(),
  boatType: z.string().optional(),
});

/** Body for POST /internal/models. */
export const createModelBodySchema = z.object({
  make: z.string().min(1),
  modelName: z.string().min(1),
  boatType: z.string().min(1),
  subtype: z.string().optional(),
  loaFt: z.string().optional(),
  lwlFt: z.string().optional(),
  beamFt: z.string().optional(),
  draftMaxFt: z.string().optional(),
  draftMinFt: z.string().optional(),
  displacementLbs: z.string().optional(),
  displacementKg: z.string().optional(),
  ballastLbs: z.string().optional(),
  hullType: z.string().optional(),
  hullMaterial: z.string().optional(),
  firstBuilt: z.number().int().optional(),
  lastBuilt: z.number().int().optional(),
  designer: z.string().optional(),
  builder: z.string().optional(),
  rigType: z.string().optional(),
  keelType: z.string().optional(),
  berthsDefault: z.number().int().optional(),
  headsDefault: z.number().int().optional(),
  waterTankL: z.string().optional(),
  fuelTankL: z.string().optional(),
});

/** Body for PUT /internal/models/:id. */
export const updateModelBodySchema = createModelBodySchema.partial();
