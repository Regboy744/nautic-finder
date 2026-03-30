/**
 * Shared type definitions used across all services.
 */

/** Standard API success response wrapper. */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** Standard API error response wrapper. */
export interface ApiErrorResponse {
  success: false;
  error: {
    statusCode: number;
    error: string;
    message: string;
    code?: string;
    details?: Record<string, string[]>;
  };
}

/** Pagination metadata included in paginated responses. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Paginated API response with items and pagination metadata. */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Authenticated user extracted from a Supabase JWT.
 * Attached to Fastify request via the auth middleware.
 */
export interface AuthUser {
  /** Supabase Auth user ID (UUID). */
  id: string;
  /** User email from the JWT. */
  email: string;
  /** JWT role (e.g., 'authenticated', 'service_role'). */
  role: string;
  /** Raw JWT claims for edge cases. */
  claims: Record<string, unknown>;
}

/** Sort direction for query ordering. */
export type SortDirection = 'asc' | 'desc';

/** Common query parameters for paginated + sortable endpoints. */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

/**
 * Generic filter for listing queries.
 * Each key maps to a value or range that narrows results.
 */
export interface ListingFilters {
  boatType?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  country?: string;
  region?: string;
  lengthMinFt?: number;
  lengthMaxFt?: number;
  hullMaterial?: string;
  fuelType?: string;
  isActive?: boolean;
}
