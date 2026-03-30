/**
 * Builds a text representation of a listing for vector embedding.
 * Combines key fields into a natural-language paragraph that captures
 * the essence of the boat for semantic search.
 */

interface EmbeddingTextInput {
  title?: string | null;
  make?: string | null;
  modelName?: string | null;
  year?: number | null;
  boatType?: string | null;
  price?: string | null;
  currency?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  lengthFt?: string | null;
  hullMaterial?: string | null;
  fuelType?: string | null;
  engineHp?: number | null;
  cabins?: number | null;
  berths?: number | null;
  description?: string | null;
  features?: string[];
  conditionAnalysis?: string | null;
}

/**
 * Builds embedding text from listing fields.
 * Returns a clean paragraph suitable for OpenAI text-embedding-3-small.
 */
export function buildEmbeddingText(input: EmbeddingTextInput): string {
  const parts: string[] = [];

  // Identity
  if (input.year && input.make && input.modelName) {
    parts.push(`${input.year} ${input.make} ${input.modelName}`);
  } else if (input.title) {
    parts.push(input.title);
  }

  // Type
  if (input.boatType) {
    parts.push(`Type: ${input.boatType}`);
  }

  // Price
  if (input.price && input.currency) {
    parts.push(`Price: ${input.currency} ${input.price}`);
  }

  // Specs
  const specs: string[] = [];
  if (input.lengthFt) specs.push(`${input.lengthFt}ft`);
  if (input.hullMaterial) specs.push(`${input.hullMaterial} hull`);
  if (input.fuelType) specs.push(input.fuelType);
  if (input.engineHp) specs.push(`${input.engineHp}hp`);
  if (input.cabins) specs.push(`${input.cabins} cabins`);
  if (input.berths) specs.push(`${input.berths} berths`);
  if (specs.length > 0) {
    parts.push(specs.join(', '));
  }

  // Location
  const loc: string[] = [];
  if (input.city) loc.push(input.city);
  if (input.region) loc.push(input.region);
  if (input.country) loc.push(input.country);
  if (loc.length > 0) {
    parts.push(`Location: ${loc.join(', ')}`);
  }

  // Features
  if (input.features && input.features.length > 0) {
    parts.push(`Features: ${input.features.slice(0, 15).join(', ')}`);
  }

  // Description (truncated)
  if (input.description) {
    const truncated = input.description.slice(0, 500).trim();
    parts.push(truncated);
  }

  // Condition
  if (input.conditionAnalysis) {
    parts.push(`Condition: ${input.conditionAnalysis.slice(0, 200)}`);
  }

  return parts.join('. ').replace(/\s+/g, ' ').trim();
}
