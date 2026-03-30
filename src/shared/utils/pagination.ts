import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/index.js';
import type { PaginationMeta, PaginationParams } from '../types/index.js';

/**
 * Clamps and normalizes raw pagination input.
 * Ensures page >= 1 and limit is within [1, MAX_PAGE_SIZE].
 */
export function normalizePagination(
  params: Partial<PaginationParams>,
): Required<Pick<PaginationParams, 'page' | 'limit'>> &
  Pick<PaginationParams, 'sortBy' | 'sortDirection'> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(params.limit ?? DEFAULT_PAGE_SIZE)));

  return {
    page,
    limit,
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
  };
}

/**
 * Calculates the SQL OFFSET from page and limit.
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Builds a PaginationMeta object from a total count and current page/limit.
 */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
