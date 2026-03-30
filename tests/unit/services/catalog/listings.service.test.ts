import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initLogger, resetLogger } from '../../../../src/shared/logger/index.js';
import { createListingsService } from '../../../../src/services/catalog/services/listings.service.js';

/** Creates a mock listing object. */
function mockListing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing-1',
    modelId: null,
    title: 'Bavaria 38',
    make: 'Bavaria',
    modelName: 'Cruiser 38',
    year: 2018,
    boatType: 'sailboat',
    subtype: null,
    price: '85000',
    currency: 'EUR',
    priceNormalizedEur: '85000',
    priceNormalizedUsd: '91800',
    country: 'Greece',
    region: 'Cyclades',
    city: null,
    marinaName: null,
    latitude: null,
    longitude: null,
    description: 'Well maintained sailboat',
    features: ['autopilot', 'bimini'],
    imageUrls: [],
    imageCount: 0,
    lengthFt: '38',
    beamFt: '12.5',
    draftFt: '6.5',
    displacementLbs: null,
    hullMaterial: 'fiberglass',
    engineMake: 'Yanmar',
    engineModel: null,
    engineHp: 40,
    engineHours: 1200,
    engineYear: null,
    fuelType: 'diesel',
    driveType: null,
    cabins: 3,
    berths: 6,
    heads: 2,
    fuelCapacityL: null,
    waterCapacityL: null,
    conditionAnalysis: null,
    conditionScore: null,
    beginnerScore: null,
    useCaseTags: null,
    safetyNotes: null,
    summaryEn: null,
    priceAssessment: null,
    priceDeltaPct: null,
    brokerId: null,
    brokerName: 'Athens Yachts',
    brokerPhone: null,
    brokerEmail: null,
    brokerWebsite: null,
    isPrivateSale: false,
    sourceUrl: 'https://example.com/listing-1',
    sourcePlatform: 'yachtworld',
    externalId: 'yw-12345',
    fingerprint: 'abc123',
    embedding: null,
    embeddingText: null,
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    lastCheckedAt: null,
    priceChangedAt: null,
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  resetLogger();
  initLogger({ level: 'silent', isDevelopment: false });
});

function buildMocks() {
  const listingsRepo = {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByExternalId: vi.fn(),
    findByFingerprint: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    findSimilar: vi.fn(),
    countActive: vi.fn(),
  };

  const priceHistoryRepo = {
    findByListingId: vi.fn(),
    create: vi.fn(),
  };

  const modelsRepo = {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByMakeAndModel: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const log = initLogger({ level: 'silent', isDevelopment: false });

  const service = createListingsService({
     
    listingsRepo: listingsRepo as any,
     
    priceHistoryRepo: priceHistoryRepo as any,
     
    modelsRepo: modelsRepo as any,
    log,
  });

  return { service, listingsRepo, priceHistoryRepo, modelsRepo };
}

describe('ListingsService', () => {
  describe('list', () => {
    it('returns paginated listings', async () => {
      const { service, listingsRepo } = buildMocks();
      listingsRepo.findMany.mockResolvedValue({ items: [mockListing()], total: 1 });

      const result = await service.list({}, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(listingsRepo.findMany).toHaveBeenCalledOnce();
    });

    it('passes filters to the repository', async () => {
      const { service, listingsRepo } = buildMocks();
      listingsRepo.findMany.mockResolvedValue({ items: [], total: 0 });

      await service.list({ make: 'Bavaria', boatType: 'sailboat' }, { page: 1, limit: 10 });

      expect(listingsRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ make: 'Bavaria', boatType: 'sailboat' }),
        0,
        10,
        expect.anything(),
      );
    });
  });

  describe('getById', () => {
    it('returns a listing with model data', async () => {
      const { service, listingsRepo } = buildMocks();
      listingsRepo.findById.mockResolvedValue({ ...mockListing(), model: null });

      const result = await service.getById('listing-1');

      expect(result.id).toBe('listing-1');
      expect(listingsRepo.findById).toHaveBeenCalledWith('listing-1');
    });

    it('throws NotFoundError if listing does not exist', async () => {
      const { service, listingsRepo } = buildMocks();
      listingsRepo.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        "Listing 'nonexistent' not found",
      );
    });
  });

  describe('create', () => {
    it('auto-links model when make and modelName match', async () => {
      const { service, listingsRepo, modelsRepo } = buildMocks();
      modelsRepo.findByMakeAndModel.mockResolvedValue({ id: 'model-1' });
      listingsRepo.create.mockResolvedValue(mockListing({ modelId: 'model-1' }));

      const result = await service.create({
        make: 'Bavaria',
        modelName: 'Cruiser 38',
        price: '85000',
      });

      expect(result.modelId).toBe('model-1');
      expect(modelsRepo.findByMakeAndModel).toHaveBeenCalledWith('Bavaria', 'Cruiser 38');
    });

    it('skips model linking if modelId already set', async () => {
      const { service, listingsRepo, modelsRepo } = buildMocks();
      listingsRepo.create.mockResolvedValue(mockListing({ modelId: 'existing' }));

      await service.create({ modelId: 'existing', make: 'Bavaria', modelName: 'Cruiser 38' });

      expect(modelsRepo.findByMakeAndModel).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('detects price changes and records history', async () => {
      const { service, listingsRepo, priceHistoryRepo } = buildMocks();
      listingsRepo.findById.mockResolvedValue({ ...mockListing(), model: null, price: '85000' });
      listingsRepo.update.mockResolvedValue(mockListing({ price: '79000' }));

      await service.update('listing-1', { price: '79000' });

      expect(priceHistoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ listingId: 'listing-1', price: '85000' }),
      );
    });

    it('does not record history when price unchanged', async () => {
      const { service, listingsRepo, priceHistoryRepo } = buildMocks();
      listingsRepo.findById.mockResolvedValue({ ...mockListing(), model: null });
      listingsRepo.update.mockResolvedValue(mockListing());

      await service.update('listing-1', { price: '85000' });

      expect(priceHistoryRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('upsert', () => {
    it('creates new listing when externalId not found', async () => {
      const { service, listingsRepo, modelsRepo } = buildMocks();
      listingsRepo.findByExternalId.mockResolvedValue(null);
      listingsRepo.findByFingerprint.mockResolvedValue(null);
      modelsRepo.findByMakeAndModel.mockResolvedValue(null);
      listingsRepo.create.mockResolvedValue(mockListing());

      const result = await service.upsert({
        externalId: 'new-123',
        sourcePlatform: 'yachtworld',
        make: 'Bavaria',
      });

      expect(result.isNew).toBe(true);
      expect(listingsRepo.create).toHaveBeenCalled();
    });

    it('updates existing listing when externalId matches', async () => {
      const { service, listingsRepo } = buildMocks();
      const existing = mockListing();
      listingsRepo.findByExternalId.mockResolvedValue(existing);
      listingsRepo.findById.mockResolvedValue({ ...existing, model: null });
      listingsRepo.update.mockResolvedValue(existing);

      const result = await service.upsert({
        externalId: 'yw-12345',
        sourcePlatform: 'yachtworld',
        title: 'Updated',
      });

      expect(result.isNew).toBe(false);
    });
  });
});
