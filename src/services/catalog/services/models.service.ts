import type { Logger } from 'pino';
import type { ModelsRepository, BoatModel, NewBoatModel } from '../repositories/index.js';
import type { PaginatedResponse, PaginationMeta } from '../../../shared/types/index.js';
import {
  normalizePagination,
  calculateOffset,
  buildPaginationMeta,
} from '../../../shared/utils/pagination.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export interface ModelsServiceDeps {
  modelsRepo: ModelsRepository;
  log: Logger;
}

/**
 * Creates the models service — business logic for boat model specs.
 */
export function createModelsService(deps: ModelsServiceDeps) {
  const { modelsRepo, log } = deps;

  return {
    /** Lists paginated models with optional filters. */
    async list(
      filters: { make?: string; boatType?: string },
      params: { page?: number; limit?: number },
    ): Promise<PaginatedResponse<BoatModel>> {
      const normalized = normalizePagination(params);
      const offset = calculateOffset(normalized.page, normalized.limit);
      const { items, total } = await modelsRepo.findMany(filters, offset, normalized.limit);
      const pagination: PaginationMeta = buildPaginationMeta(
        total,
        normalized.page,
        normalized.limit,
      );
      return { success: true, data: items, pagination };
    },

    /** Gets a model by ID. */
    async getById(id: string): Promise<BoatModel> {
      const model = await modelsRepo.findById(id);
      if (!model) throw new NotFoundError('Model', id);
      return model;
    },

    /** Creates a new model (internal API). */
    async create(data: NewBoatModel): Promise<BoatModel> {
      const created = await modelsRepo.create(data);
      log.info(
        { modelId: created.id, make: created.make, model: created.modelName },
        'Model created',
      );
      return created;
    },

    /** Updates a model (internal API). */
    async update(id: string, data: Partial<NewBoatModel>): Promise<BoatModel> {
      const updated = await modelsRepo.update(id, data);
      if (!updated) throw new NotFoundError('Model', id);
      log.info({ modelId: id }, 'Model updated');
      return updated;
    },
  };
}

export type ModelsService = ReturnType<typeof createModelsService>;
