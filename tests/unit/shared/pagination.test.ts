import { describe, it, expect } from 'vitest';
import {
  normalizePagination,
  calculateOffset,
  buildPaginationMeta,
} from '../../../src/shared/utils/pagination.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../../src/shared/constants/index.js';

describe('normalizePagination', () => {
  it('applies defaults when no params given', () => {
    const result = normalizePagination({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it('respects provided page and limit', () => {
    const result = normalizePagination({ page: 3, limit: 50 });

    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('clamps page to minimum of 1', () => {
    expect(normalizePagination({ page: 0 }).page).toBe(1);
    expect(normalizePagination({ page: -5 }).page).toBe(1);
  });

  it('clamps limit to maximum of MAX_PAGE_SIZE', () => {
    expect(normalizePagination({ limit: 500 }).limit).toBe(MAX_PAGE_SIZE);
  });

  it('clamps limit to minimum of 1', () => {
    expect(normalizePagination({ limit: 0 }).limit).toBe(1);
    expect(normalizePagination({ limit: -10 }).limit).toBe(1);
  });

  it('floors fractional page and limit values', () => {
    const result = normalizePagination({ page: 2.7, limit: 15.3 });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(15);
  });

  it('passes through sortBy and sortDirection', () => {
    const result = normalizePagination({ sortBy: 'price', sortDirection: 'desc' });

    expect(result.sortBy).toBe('price');
    expect(result.sortDirection).toBe('desc');
  });
});

describe('calculateOffset', () => {
  it('returns 0 for page 1', () => {
    expect(calculateOffset(1, 20)).toBe(0);
  });

  it('calculates correct offset for page 3 with limit 20', () => {
    expect(calculateOffset(3, 20)).toBe(40);
  });

  it('works with limit of 1', () => {
    expect(calculateOffset(5, 1)).toBe(4);
  });
});

describe('buildPaginationMeta', () => {
  it('builds correct meta for a standard page', () => {
    const meta = buildPaginationMeta(95, 2, 20);

    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(20);
    expect(meta.total).toBe(95);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it('handles first page correctly', () => {
    const meta = buildPaginationMeta(50, 1, 20);

    expect(meta.hasPreviousPage).toBe(false);
    expect(meta.hasNextPage).toBe(true);
  });

  it('handles last page correctly', () => {
    const meta = buildPaginationMeta(50, 3, 20);

    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it('handles single page of results', () => {
    const meta = buildPaginationMeta(5, 1, 20);

    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('handles zero results', () => {
    const meta = buildPaginationMeta(0, 1, 20);

    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('handles exact page boundary', () => {
    const meta = buildPaginationMeta(40, 2, 20);

    expect(meta.totalPages).toBe(2);
    expect(meta.hasNextPage).toBe(false);
  });
});
