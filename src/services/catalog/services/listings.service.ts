import type { Logger } from 'pino';
import type {
  ListingsRepository,
  BoatListing,
  NewBoatListing,
  ListingWithModel,
} from '../repositories/index.js';
import type { PriceHistoryRepository } from '../repositories/index.js';
import type { ModelsRepository } from '../repositories/index.js';
import type {
  ListingFilters,
  PaginatedResponse,
  PaginationMeta,
} from '../../../shared/types/index.js';
import {
  normalizePagination,
  calculateOffset,
  buildPaginationMeta,
} from '../../../shared/utils/pagination.js';
import { NotFoundError } from '../../../shared/errors/index.js';

/** Dependencies injected into the listings service. */
export interface ListingsServiceDeps {
  listingsRepo: ListingsRepository;
  priceHistoryRepo: PriceHistoryRepository;
  modelsRepo: ModelsRepository;
  log: Logger;
}

/**
 * Creates the listings service — business logic for boat listings.
 */
export function createListingsService(deps: ListingsServiceDeps) {
  const { listingsRepo, priceHistoryRepo, modelsRepo, log } = deps;

  return {
    /**
     * Lists paginated listings with optional filters.
     */
    async list(
      filters: ListingFilters,
      params: { page?: number; limit?: number; sortBy?: string; sortDirection?: 'asc' | 'desc' },
    ): Promise<PaginatedResponse<BoatListing>> {
      const normalized = normalizePagination(params);
      const offset = calculateOffset(normalized.page, normalized.limit);

      const { items, total } = await listingsRepo.findMany(filters, offset, normalized.limit, {
        sortBy: normalized.sortBy,
        sortDirection: normalized.sortDirection,
      });

      const pagination: PaginationMeta = buildPaginationMeta(
        total,
        normalized.page,
        normalized.limit,
      );

      return { success: true, data: items, pagination };
    },

    /**
     * Gets a single listing by ID, enriched with model data when available.
     */
    async getById(id: string): Promise<ListingWithModel> {
      const listing = await listingsRepo.findById(id);
      if (!listing) throw new NotFoundError('Listing', id);
      return listing;
    },

    /**
     * Gets price history for a listing.
     */
    async getPriceHistory(listingId: string) {
      // Verify listing exists first
      const listing = await listingsRepo.findById(listingId);
      if (!listing) throw new NotFoundError('Listing', listingId);

      return priceHistoryRepo.findByListingId(listingId);
    },

    /**
     * Finds similar listings based on make, type, and year range.
     */
    async getSimilar(id: string, limit = 5): Promise<BoatListing[]> {
      const listing = await listingsRepo.findById(id);
      if (!listing) throw new NotFoundError('Listing', id);
      return listingsRepo.findSimilar(listing, limit);
    },

    /**
     * Creates a new listing (called by scraper via internal API).
     * Attempts to auto-link to a known model by fuzzy matching make + model name.
     * Returns the created listing.
     */
    async create(data: NewBoatListing): Promise<BoatListing> {
      // Auto-link model if make + modelName are present and modelId is not set
      if (!data.modelId && data.make && data.modelName) {
        const model = await modelsRepo.findByMakeAndModel(data.make, data.modelName);
        if (model) {
          data.modelId = model.id;
          log.info(
            { make: data.make, modelName: data.modelName, modelId: model.id },
            'Auto-linked listing to model',
          );
        }
      }

      const created = await listingsRepo.create(data);
      log.info({ listingId: created.id }, 'Listing created');
      return created;
    },

    /**
     * Updates an existing listing (called by scraper).
     * Detects price changes and records them in price_history.
     */
    async update(id: string, data: Partial<NewBoatListing>): Promise<BoatListing> {
      const existing = await listingsRepo.findById(id);
      if (!existing) throw new NotFoundError('Listing', id);

      // Detect price change
      const oldPrice = existing.price;
      const newPrice = data.price;
      const priceChanged = newPrice !== undefined && newPrice !== oldPrice;

      if (priceChanged) {
        // Record the old price in history
        await priceHistoryRepo.create({
          listingId: id,
          price: oldPrice ?? '0',
          currency: existing.currency ?? 'EUR',
          priceNormalizedEur: existing.priceNormalizedEur,
          priceNormalizedUsd: existing.priceNormalizedUsd,
        });

        // Set price change timestamp
        data.priceChangedAt = new Date();

        log.info({ listingId: id, oldPrice, newPrice }, 'Price change detected');
      }

      // Update lastSeenAt on every scrape pass
      data.lastSeenAt = new Date();

      const updated = await listingsRepo.update(id, data);
      if (!updated) throw new NotFoundError('Listing', id);

      return updated;
    },

    /**
     * Upserts a listing by external ID (for scraper dedup).
     * Creates if new, updates if existing.
     */
    async upsert(data: NewBoatListing): Promise<{ listing: BoatListing; isNew: boolean }> {
      // Try to find by externalId + sourcePlatform first
      if (data.externalId && data.sourcePlatform) {
        const existing = await listingsRepo.findByExternalId(data.externalId, data.sourcePlatform);
        if (existing) {
          const updated = await this.update(existing.id, data);
          return { listing: updated, isNew: false };
        }
      }

      // Try fingerprint dedup
      if (data.fingerprint) {
        const existing = await listingsRepo.findByFingerprint(data.fingerprint);
        if (existing) {
          const updated = await this.update(existing.id, data);
          return { listing: updated, isNew: false };
        }
      }

      // New listing
      const created = await this.create(data);
      return { listing: created, isNew: true };
    },
  };
}

export type ListingsService = ReturnType<typeof createListingsService>;
