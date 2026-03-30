/**
 * Filter extractor — converts natural language queries to structured search filters.
 * Uses Gemini Flash for fast, cheap extraction.
 *
 * Example:
 * "I'm looking for a sailboat under 50k euros, around 35-40 feet, in Greece"
 * → { boatType: "sailboat", priceMax: 50000, currency: "EUR", lengthMinFt: 35, lengthMaxFt: 40, country: "Greece" }
 */

import type { GeminiProvider } from './providers/gemini.provider.js';
import type { ExtractedFilters } from './types.js';
import type { Logger } from 'pino';

/** The extraction prompt template. */
const EXTRACTION_PROMPT = `You are a boat search filter extractor. Extract structured search filters from the user's natural language query.

Return ONLY a valid JSON object with these optional fields (omit fields not mentioned):
- boatType: "sailboat" | "motorboat" | "catamaran" | "trawler" | "center-console" | "pontoon" | "jet-ski" | "dinghy" | "houseboat"
- make: manufacturer name (e.g., "Bavaria", "Beneteau")
- model: model name (e.g., "Oceanis 40.1")
- yearMin: minimum year (integer)
- yearMax: maximum year (integer)
- priceMin: minimum price (number, no currency symbol)
- priceMax: maximum price (number, no currency symbol)
- currency: "EUR" | "USD" | "GBP" (default EUR if euros mentioned, USD if dollars)
- country: country name
- region: region/state name
- lengthMinFt: minimum length in feet (convert from metres if needed: 1m = 3.28ft)
- lengthMaxFt: maximum length in feet
- hullMaterial: "fiberglass" | "aluminum" | "steel" | "wood" | "carbon-fiber"
- fuelType: "diesel" | "gasoline" | "electric" | "hybrid"
- keywords: any remaining search terms that don't fit structured filters

IMPORTANT: Return ONLY the JSON object, no markdown, no explanation.

User query: `;

/**
 * Creates a filter extractor that uses Gemini to parse natural language.
 */
export function createFilterExtractor(gemini: GeminiProvider, log: Logger) {
  return {
    /**
     * Extracts structured filters from a natural language query.
     */
    async extract(query: string): Promise<ExtractedFilters> {
      const result = await gemini.generateText(EXTRACTION_PROMPT + query, {
        temperature: 0.1, // Low temperature for deterministic extraction
      });

      try {
        // Clean up the response — remove markdown code fences if present
        let jsonStr = result.text.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonStr) as ExtractedFilters;

        log.debug(
          { query, filters: parsed, tokensUsed: result.tokensUsed.total },
          'Filters extracted',
        );

        return parsed;
      } catch (err) {
        log.warn({ query, rawResponse: result.text, err }, 'Failed to parse filter extraction');
        // Return empty filters on parse failure — search will still work without filters
        return {};
      }
    },
  };
}

export type FilterExtractor = ReturnType<typeof createFilterExtractor>;
