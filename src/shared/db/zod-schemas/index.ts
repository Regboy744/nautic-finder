import { z } from 'zod';

// =============================================================================
// Broker Schemas
// =============================================================================

export const insertBrokerSchema = z.object({
  name: z.string().min(1),
  website: z.string().url(),
  scraperType: z.enum(['playwright', 'cheerio']),
  scraperConfig: z.record(z.string(), z.unknown()).optional(),
  scrapingSchedule: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBrokerSchema = insertBrokerSchema.partial();

// =============================================================================
// Boat Model Schemas
// =============================================================================

export const insertBoatModelSchema = z.object({
  make: z.string().min(1),
  modelName: z.string().min(1),
  boatType: z.string().min(1),
  subtype: z.string().nullable().optional(),
  loaFt: z.string().nullable().optional(),
  lwlFt: z.string().nullable().optional(),
  beamFt: z.string().nullable().optional(),
  draftMaxFt: z.string().nullable().optional(),
  draftMinFt: z.string().nullable().optional(),
  displacementLbs: z.string().nullable().optional(),
  displacementKg: z.string().nullable().optional(),
  ballastLbs: z.string().nullable().optional(),
  hullType: z.string().nullable().optional(),
  hullMaterial: z.string().nullable().optional(),
  firstBuilt: z.number().int().nullable().optional(),
  lastBuilt: z.number().int().nullable().optional(),
  designer: z.string().nullable().optional(),
  builder: z.string().nullable().optional(),
  rigType: z.string().nullable().optional(),
  keelType: z.string().nullable().optional(),
  berthsDefault: z.number().int().nullable().optional(),
  headsDefault: z.number().int().nullable().optional(),
  waterTankL: z.string().nullable().optional(),
  fuelTankL: z.string().nullable().optional(),
});

export const updateBoatModelSchema = insertBoatModelSchema.partial();

// =============================================================================
// Boat Listing Schemas
// =============================================================================

export const insertBoatListingSchema = z.object({
  modelId: z.string().uuid().nullable().optional(),
  title: z.string().nullable().optional(),
  make: z.string().nullable().optional(),
  modelName: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  boatType: z.string().nullable().optional(),
  subtype: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  priceNormalizedEur: z.string().nullable().optional(),
  priceNormalizedUsd: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  marinaName: z.string().nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  features: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  imageCount: z.number().int().default(0),
  lengthFt: z.string().nullable().optional(),
  beamFt: z.string().nullable().optional(),
  draftFt: z.string().nullable().optional(),
  hullMaterial: z.string().nullable().optional(),
  engineMake: z.string().nullable().optional(),
  engineModel: z.string().nullable().optional(),
  engineHp: z.number().int().nullable().optional(),
  engineHours: z.number().int().nullable().optional(),
  cabins: z.number().int().nullable().optional(),
  berths: z.number().int().nullable().optional(),
  heads: z.number().int().nullable().optional(),
  brokerId: z.string().uuid().nullable().optional(),
  brokerName: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  sourcePlatform: z.string().nullable().optional(),
  externalId: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateBoatListingSchema = insertBoatListingSchema.partial();

// =============================================================================
// User Schemas
// =============================================================================

export const insertUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'expert']).default('beginner'),
  preferences: z.record(z.string(), z.unknown()).nullable().optional(),
  notificationSettings: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const updateUserSchema = insertUserSchema
  .omit({ id: true, email: true })
  .partial();

// =============================================================================
// Saved Boat Schemas
// =============================================================================

export const insertSavedBoatSchema = z.object({
  userId: z.string().uuid(),
  listingId: z.string().uuid(),
  notes: z.string().nullable().optional(),
});

// =============================================================================
// Search Alert Schemas
// =============================================================================

export const insertSearchAlertSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  filters: z.record(z.string(), z.unknown()).nullable().optional(),
  keywords: z.string().nullable().optional(),
  frequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
  isActive: z.boolean().default(true),
});

export const updateSearchAlertSchema = insertSearchAlertSchema
  .omit({ userId: true })
  .partial();

// =============================================================================
// Conversation Schemas
// =============================================================================

export const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string(),
  boatsReferenced: z.array(z.string()).optional(),
});

export const insertConversationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().nullable().optional(),
  messages: z.array(messageSchema).default([]),
  searchContext: z.record(z.string(), z.unknown()).nullable().optional(),
});

// =============================================================================
// Price History Schemas
// =============================================================================

export const insertPriceHistorySchema = z.object({
  listingId: z.string().uuid(),
  price: z.string(),
  currency: z.string(),
  priceNormalizedEur: z.string().nullable().optional(),
  priceNormalizedUsd: z.string().nullable().optional(),
});
