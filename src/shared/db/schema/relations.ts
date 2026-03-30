import { relations } from 'drizzle-orm';
import { boatModels } from './boat-models.js';
import { boatListings } from './boat-listings.js';
import { brokers } from './brokers.js';
import { calculatedRatios } from './calculated-ratios.js';
import { priceHistory } from './price-history.js';
import { boatImagesAnalysis } from './boat-images-analysis.js';
import { users } from './users.js';
import { savedBoats } from './saved-boats.js';
import { searchAlerts } from './search-alerts.js';
import { conversations } from './conversations.js';

// --- Boat Models Relations ---

export const boatModelsRelations = relations(boatModels, ({ many, one }) => ({
  listings: many(boatListings),
  ratios: one(calculatedRatios),
}));

// --- Boat Listings Relations ---

export const boatListingsRelations = relations(boatListings, ({ one, many }) => ({
  model: one(boatModels, {
    fields: [boatListings.modelId],
    references: [boatModels.id],
  }),
  broker: one(brokers, {
    fields: [boatListings.brokerId],
    references: [brokers.id],
  }),
  priceHistory: many(priceHistory),
  imagesAnalysis: many(boatImagesAnalysis),
  savedBy: many(savedBoats),
}));

// --- Brokers Relations ---

export const brokersRelations = relations(brokers, ({ many }) => ({
  listings: many(boatListings),
}));

// --- Calculated Ratios Relations ---

export const calculatedRatiosRelations = relations(calculatedRatios, ({ one }) => ({
  model: one(boatModels, {
    fields: [calculatedRatios.modelId],
    references: [boatModels.id],
  }),
}));

// --- Price History Relations ---

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  listing: one(boatListings, {
    fields: [priceHistory.listingId],
    references: [boatListings.id],
  }),
}));

// --- Boat Images Analysis Relations ---

export const boatImagesAnalysisRelations = relations(boatImagesAnalysis, ({ one }) => ({
  listing: one(boatListings, {
    fields: [boatImagesAnalysis.listingId],
    references: [boatListings.id],
  }),
}));

// --- Users Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  savedBoats: many(savedBoats),
  searchAlerts: many(searchAlerts),
  conversations: many(conversations),
}));

// --- Saved Boats Relations ---

export const savedBoatsRelations = relations(savedBoats, ({ one }) => ({
  user: one(users, {
    fields: [savedBoats.userId],
    references: [users.id],
  }),
  listing: one(boatListings, {
    fields: [savedBoats.listingId],
    references: [boatListings.id],
  }),
}));

// --- Search Alerts Relations ---

export const searchAlertsRelations = relations(searchAlerts, ({ one }) => ({
  user: one(users, {
    fields: [searchAlerts.userId],
    references: [users.id],
  }),
}));

// --- Conversations Relations ---

export const conversationsRelations = relations(conversations, ({ one }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
}));
