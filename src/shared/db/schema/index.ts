/**
 * Barrel export for all database schema definitions.
 * Import from here instead of individual files.
 */

// Tables
export { brokers } from './brokers.js';
export { boatModels } from './boat-models.js';
export { boatListings } from './boat-listings.js';
export { calculatedRatios } from './calculated-ratios.js';
export { priceHistory } from './price-history.js';
export { boatImagesAnalysis } from './boat-images-analysis.js';
export { users } from './users.js';
export { savedBoats } from './saved-boats.js';
export { searchAlerts } from './search-alerts.js';
export { conversations } from './conversations.js';
export { marketStats } from './market-stats.js';

// Relations
export {
  boatModelsRelations,
  boatListingsRelations,
  brokersRelations,
  calculatedRatiosRelations,
  priceHistoryRelations,
  boatImagesAnalysisRelations,
  usersRelations,
  savedBoatsRelations,
  searchAlertsRelations,
  conversationsRelations,
} from './relations.js';

// Custom types
export { customVector } from './custom-types.js';
