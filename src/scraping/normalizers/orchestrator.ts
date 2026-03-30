/**
 * Normalizer orchestrator — transforms raw scraped data into a clean,
 * normalized listing ready for upsert into the catalog API.
 */

import type { RawListingData } from '../types.js';
import type { NewBoatListing } from '../../services/catalog/repositories/listings.repository.js';
import { normalizePrice } from './price.normalizer.js';
import { normalizeLength } from './length.normalizer.js';
import { normalizeBoatType } from './boat-type.normalizer.js';
import { normalizeLocation } from './location.normalizer.js';
import { generateFingerprint } from './fingerprint.js';
import { buildEmbeddingText } from './embedding-text.js';

/**
 * Normalizes raw scraped listing data into a structured object
 * ready for the catalog upsert API.
 */
export function normalizeListing(raw: RawListingData): Partial<NewBoatListing> {
  // Price
  const { price, currency } = normalizePrice(raw.price, raw.currency ?? undefined);

  // Lengths
  const lengthFt = normalizeLength(raw.lengthFt);
  const beamFt = normalizeLength(raw.beamFt);
  const draftFt = normalizeLength(raw.draftFt);

  // Boat type
  const boatType = normalizeBoatType(raw.boatType);

  // Location
  const location = normalizeLocation(raw.location);

  // Numeric fields
  const year = raw.year ? parseInt(raw.year, 10) : undefined;
  const engineHp = raw.engineHp ? parseInt(raw.engineHp, 10) : undefined;
  const engineHours = raw.engineHours ? parseInt(raw.engineHours, 10) : undefined;
  const cabins = raw.cabins ? parseInt(raw.cabins, 10) : undefined;
  const berths = raw.berths ? parseInt(raw.berths, 10) : undefined;
  const heads = raw.heads ? parseInt(raw.heads, 10) : undefined;

  // Clean image URLs
  const imageUrls = (raw.imageUrls ?? []).filter((url) => url.startsWith('http'));

  // Fingerprint
  const fingerprint = generateFingerprint({
    make: raw.make,
    modelName: raw.model,
    year,
    lengthFt,
    country: location.country,
  });

  // Build the normalized listing
  const normalized: Partial<NewBoatListing> = {
    sourceUrl: raw.sourceUrl,
    sourcePlatform: raw.sourcePlatform,
    externalId: raw.externalId,
    fingerprint,
    title: raw.title ?? undefined,
    make: raw.make ?? undefined,
    modelName: raw.model ?? undefined,
    year: isNaN(year ?? NaN) ? undefined : year,
    boatType,
    price: price ?? undefined,
    currency: currency ?? undefined,
    country: location.country ?? undefined,
    region: location.region ?? undefined,
    city: location.city ?? undefined,
    description: raw.description ?? undefined,
    imageUrls,
    imageCount: imageUrls.length,
    lengthFt: lengthFt ?? undefined,
    beamFt: beamFt ?? undefined,
    draftFt: draftFt ?? undefined,
    hullMaterial: raw.hullMaterial ?? undefined,
    engineMake: raw.engineMake ?? undefined,
    engineModel: raw.engineModel ?? undefined,
    engineHp: isNaN(engineHp ?? NaN) ? undefined : engineHp,
    engineHours: isNaN(engineHours ?? NaN) ? undefined : engineHours,
    fuelType: raw.fuelType ?? undefined,
    cabins: isNaN(cabins ?? NaN) ? undefined : cabins,
    berths: isNaN(berths ?? NaN) ? undefined : berths,
    heads: isNaN(heads ?? NaN) ? undefined : heads,
    brokerName: raw.brokerName ?? undefined,
    brokerPhone: raw.brokerPhone ?? undefined,
    brokerEmail: raw.brokerEmail ?? undefined,
    features: (raw.extra?.features ?? '')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean),
  };

  // Build embedding text
  const embeddingText = buildEmbeddingText({
    title: normalized.title,
    make: normalized.make,
    modelName: normalized.modelName,
    year: normalized.year,
    boatType: normalized.boatType,
    price: normalized.price,
    currency: normalized.currency,
    country: normalized.country,
    region: normalized.region,
    city: normalized.city,
    lengthFt: normalized.lengthFt,
    hullMaterial: normalized.hullMaterial,
    fuelType: normalized.fuelType,
    engineHp: normalized.engineHp,
    cabins: normalized.cabins,
    berths: normalized.berths,
    description: normalized.description,
    features: normalized.features,
  });

  normalized.embeddingText = embeddingText;

  return normalized;
}
