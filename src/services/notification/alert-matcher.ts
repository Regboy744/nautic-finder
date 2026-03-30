/**
 * Alert matcher — checks if a new/updated listing matches any active search alerts.
 * Called when a listing is created or updated (price change).
 */

import type { BoatListing } from '../catalog/repositories/listings.repository.js';
import type { SearchAlert } from '../user/repositories/search-alerts.repository.js';

/** Result of matching a listing against an alert. */
export interface AlertMatch {
  alertId: string;
  userId: string;
  alertName: string;
  matchReason: string;
}

/**
 * Checks if a listing matches an alert's filters.
 * Filters stored in the alert's JSONB `filters` field.
 */
export function matchListingToAlert(listing: BoatListing, alert: SearchAlert): boolean {
  const filters = alert.filters ?? {};

  // No filters = matches everything (keyword-only alert)
  if (Object.keys(filters).length === 0 && !alert.keywords) return false;

  // Check each filter
  if (filters.boatType && listing.boatType !== filters.boatType) return false;

  if (filters.make && listing.make) {
    if (!listing.make.toLowerCase().includes((filters.make as string).toLowerCase())) return false;
  }

  if (filters.model && listing.modelName) {
    if (!listing.modelName.toLowerCase().includes((filters.model as string).toLowerCase()))
      return false;
  }

  if (filters.yearMin && listing.year && listing.year < (filters.yearMin as number)) return false;
  if (filters.yearMax && listing.year && listing.year > (filters.yearMax as number)) return false;

  if (filters.priceMax && listing.priceNormalizedEur) {
    if (parseFloat(listing.priceNormalizedEur) > (filters.priceMax as number)) return false;
  }
  if (filters.priceMin && listing.priceNormalizedEur) {
    if (parseFloat(listing.priceNormalizedEur) < (filters.priceMin as number)) return false;
  }

  if (filters.country && listing.country) {
    if (!listing.country.toLowerCase().includes((filters.country as string).toLowerCase()))
      return false;
  }

  if (filters.lengthMinFt && listing.lengthFt) {
    if (parseFloat(listing.lengthFt) < (filters.lengthMinFt as number)) return false;
  }
  if (filters.lengthMaxFt && listing.lengthFt) {
    if (parseFloat(listing.lengthFt) > (filters.lengthMaxFt as number)) return false;
  }

  // Keyword check (basic substring match)
  if (alert.keywords) {
    const kw = alert.keywords.toLowerCase();
    const searchable = [listing.title, listing.make, listing.modelName, listing.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!searchable.includes(kw)) return false;
  }

  return true;
}

/**
 * Finds all alerts that match a given listing.
 */
export function findMatchingAlerts(listing: BoatListing, alerts: SearchAlert[]): AlertMatch[] {
  const matches: AlertMatch[] = [];

  for (const alert of alerts) {
    if (!alert.isActive) continue;

    if (matchListingToAlert(listing, alert)) {
      matches.push({
        alertId: alert.id,
        userId: alert.userId,
        alertName: alert.name,
        matchReason: buildMatchReason(listing, alert),
      });
    }
  }

  return matches;
}

/** Builds a human-readable reason why the listing matched. */
function buildMatchReason(listing: BoatListing, alert: SearchAlert): string {
  const parts: string[] = [];
  const filters = alert.filters ?? {};

  if (filters.boatType) parts.push(`type: ${listing.boatType}`);
  if (filters.make) parts.push(`make: ${listing.make}`);
  if (filters.priceMax) parts.push(`price: ${listing.currency ?? 'EUR'} ${listing.price ?? 'N/A'}`);
  if (filters.country) parts.push(`location: ${listing.country}`);
  if (alert.keywords) parts.push(`keywords: "${alert.keywords}"`);

  return parts.length > 0 ? `Matched: ${parts.join(', ')}` : 'Matched alert criteria';
}
