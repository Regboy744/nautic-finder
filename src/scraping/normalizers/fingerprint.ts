import { createHash } from 'node:crypto';

/**
 * Generates a deduplication fingerprint for a listing.
 * Hash of normalized: make + model + year + length + location.
 * Two listings with the same fingerprint are likely the same boat.
 */
export function generateFingerprint(fields: {
  make?: string | null;
  modelName?: string | null;
  year?: number | string | null;
  lengthFt?: string | null;
  country?: string | null;
}): string {
  const parts = [
    (fields.make ?? '').toLowerCase().trim(),
    (fields.modelName ?? '').toLowerCase().trim(),
    String(fields.year ?? ''),
    String(fields.lengthFt ?? ''),
    (fields.country ?? '').toLowerCase().trim(),
  ];

  const input = parts.join('|');
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}
