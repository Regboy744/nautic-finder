import { describe, it, expect } from 'vitest';
import {
  insertBrokerSchema,
  insertBoatModelSchema,
  insertBoatListingSchema,
  insertUserSchema,
  insertSavedBoatSchema,
  insertSearchAlertSchema,
  insertConversationSchema,
  insertPriceHistorySchema,
  updateBrokerSchema,
} from '../../../src/shared/db/zod-schemas/index.js';

describe('Broker schemas', () => {
  it('accepts valid broker data', () => {
    const result = insertBrokerSchema.safeParse({
      name: 'YachtWorld',
      website: 'https://www.yachtworld.com',
      scraperType: 'playwright',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid scraper type', () => {
    const result = insertBrokerSchema.safeParse({
      name: 'Test',
      website: 'https://example.com',
      scraperType: 'selenium',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid website URL', () => {
    const result = insertBrokerSchema.safeParse({
      name: 'Test',
      website: 'not-a-url',
      scraperType: 'cheerio',
    });
    expect(result.success).toBe(false);
  });

  it('allows partial updates', () => {
    const result = updateBrokerSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });
});

describe('Boat Model schemas', () => {
  it('accepts valid model data', () => {
    const result = insertBoatModelSchema.safeParse({
      make: 'Beneteau',
      modelName: 'Oceanis 40.1',
      boatType: 'sailboat',
    });
    expect(result.success).toBe(true);
  });

  it('requires make, modelName, and boatType', () => {
    const result = insertBoatModelSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts optional dimension fields', () => {
    const result = insertBoatModelSchema.safeParse({
      make: 'Beneteau',
      modelName: 'Oceanis 40.1',
      boatType: 'sailboat',
      loaFt: '40.1',
      beamFt: '13.1',
      designer: 'Finot-Conq',
    });
    expect(result.success).toBe(true);
  });
});

describe('Boat Listing schemas', () => {
  it('accepts minimal listing data', () => {
    const result = insertBoatListingSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full listing data', () => {
    const result = insertBoatListingSchema.safeParse({
      title: '2020 Beneteau Oceanis 40.1',
      make: 'Beneteau',
      modelName: 'Oceanis 40.1',
      year: 2020,
      boatType: 'sailboat',
      price: '185000',
      currency: 'EUR',
      country: 'FR',
      features: ['bow thruster', 'autopilot'],
      imageUrls: ['https://example.com/photo1.jpg'],
      imageCount: 1,
    });
    expect(result.success).toBe(true);
  });

  it('defaults features and imageUrls to empty arrays', () => {
    const result = insertBoatListingSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.features).toEqual([]);
      expect(result.data.imageUrls).toEqual([]);
    }
  });
});

describe('User schemas', () => {
  it('accepts valid user data', () => {
    const result = insertUserSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = insertUserSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for id', () => {
    const result = insertUserSchema.safeParse({
      id: 'not-a-uuid',
      email: 'user@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('defaults experience level to beginner', () => {
    const result = insertUserSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experienceLevel).toBe('beginner');
    }
  });
});

describe('Saved Boat schemas', () => {
  it('accepts valid saved boat', () => {
    const result = insertSavedBoatSchema.safeParse({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      listingId: '123e4567-e89b-12d3-a456-426614174001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing userId', () => {
    const result = insertSavedBoatSchema.safeParse({
      listingId: '123e4567-e89b-12d3-a456-426614174001',
    });
    expect(result.success).toBe(false);
  });
});

describe('Search Alert schemas', () => {
  it('accepts valid alert', () => {
    const result = insertSearchAlertSchema.safeParse({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Sailboats under 40k',
      frequency: 'daily',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid frequency', () => {
    const result = insertSearchAlertSchema.safeParse({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test',
      frequency: 'hourly',
    });
    expect(result.success).toBe(false);
  });
});

describe('Conversation schemas', () => {
  it('accepts valid conversation', () => {
    const result = insertConversationSchema.safeParse({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Looking for a sailboat',
      messages: [
        {
          role: 'user',
          content: 'I want a sailboat under 40k',
          timestamp: new Date().toISOString(),
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('defaults messages to empty array', () => {
    const result = insertConversationSchema.safeParse({
      userId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toEqual([]);
    }
  });
});

describe('Price History schemas', () => {
  it('accepts valid price history entry', () => {
    const result = insertPriceHistorySchema.safeParse({
      listingId: '123e4567-e89b-12d3-a456-426614174000',
      price: '185000',
      currency: 'EUR',
      priceNormalizedEur: '185000',
      priceNormalizedUsd: '201000',
    });
    expect(result.success).toBe(true);
  });

  it('requires listingId, price, and currency', () => {
    const result = insertPriceHistorySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
