import { customType } from 'drizzle-orm/pg-core';

/**
 * Custom Drizzle column type for pgvector's `vector` type.
 * Stores float arrays as vector(N) columns for similarity search.
 */
export const customVector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config?) {
    const dims = config?.dimensions ?? 1536;
    return `vector(${dims})`;
  },
  fromDriver(value: string): number[] {
    // pgvector returns vectors as "[0.1,0.2,0.3]" strings
    return value
      .slice(1, -1)
      .split(',')
      .map((v) => parseFloat(v));
  },
  toDriver(value: number[]): string {
    // pgvector expects vectors as "[0.1,0.2,0.3]" strings
    return `[${value.join(',')}]`;
  },
});
