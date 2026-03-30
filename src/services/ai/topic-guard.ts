/**
 * Topic guard — filters out off-topic messages before they reach the AI.
 *
 * Two-stage check:
 * 1. Fast keyword pre-check (no AI cost)
 * 2. Optional AI classification (only if keyword check is ambiguous)
 *
 * Goal: Save AI costs by rejecting clearly off-topic messages early.
 */

/** Nautical keywords that indicate an on-topic message. */
const NAUTICAL_KEYWORDS = [
  'boat',
  'yacht',
  'sail',
  'sailing',
  'motor',
  'catamaran',
  'trawler',
  'ketch',
  'sloop',
  'hull',
  'keel',
  'draft',
  'beam',
  'displacement',
  'berth',
  'cabin',
  'galley',
  'anchor',
  'marina',
  'mooring',
  'dock',
  'engine',
  'outboard',
  'inboard',
  'diesel',
  'knot',
  'nautical',
  'cruiser',
  'fishing',
  'pontoon',
  'dinghy',
  'rib',
  'inflatable',
  'charter',
  'broker',
  'listing',
  'price',
  'buy',
  'sell',
  'ocean',
  'sea',
  'waterway',
  'harbor',
  'harbour',
  'port',
  'coast',
  'island',
  'navigation',
  'radar',
  'autopilot',
  'gps',
  'vhf',
  'plotter',
  'bimini',
  'dodger',
  'winch',
  'cleat',
  'fender',
  'halyard',
  'sheet',
  'jib',
  'spinnaker',
  'mainsail',
  'genoa',
  'furling',
  'rigging',
  'fiberglass',
  'fibreglass',
  'aluminum',
  'aluminium',
  'steel',
  'wood',
  'bavaria',
  'beneteau',
  'jeanneau',
  'hanse',
  'hallberg-rassy',
  'lagoon',
  'fountaine',
  'leopard',
  'nauticat',
  'sweden',
  'oyster',
  'sunseeker',
  'princess',
  'ferretti',
  'azimut',
  'pershing',
  'boston whaler',
  'grady-white',
  'sea ray',
  'bertram',
  'viking',
  'liveaboard',
  'bluewater',
  'coastal',
  'offshore',
  'passage',
  'feet',
  'ft',
  'metre',
  'meter',
  'ton',
  'tonne',
  'hp',
  'horsepower',
];

/** Clearly off-topic patterns. */
const OFF_TOPIC_PATTERNS = [
  /\b(bitcoin|crypto|nft|stocks?|forex|invest)\b/i,
  /\b(recipe|cook|bak(e|ing)|ingredient)\b/i,
  /\b(homework|assignment|essay|exam)\b/i,
  /\b(code|program|javascript|python|react)\b/i,
  /\b(weather forecast for (?!sailing|boating|marina))/i,
  /\b(movie|film|netflix|spotify|game)\b/i,
  /\b(political|election|president|congress)\b/i,
];

/** Result of a topic guard check. */
export interface TopicGuardResult {
  /** Whether the message is on-topic (nautical/boat related). */
  isOnTopic: boolean;
  /** Confidence level: 'certain', 'likely', 'ambiguous'. */
  confidence: 'certain' | 'likely' | 'ambiguous';
  /** Why the decision was made (for logging). */
  reason: string;
}

/**
 * Checks if a user message is on-topic (nautical/boat related).
 * Uses keyword matching — no AI cost.
 */
export function checkTopic(message: string): TopicGuardResult {
  const lower = message.toLowerCase();

  // Check for clearly off-topic patterns first
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(message)) {
      return {
        isOnTopic: false,
        confidence: 'certain',
        reason: 'Matched off-topic pattern',
      };
    }
  }

  // Count nautical keyword matches
  let matchCount = 0;
  const matchedKeywords: string[] = [];

  for (const keyword of NAUTICAL_KEYWORDS) {
    if (lower.includes(keyword)) {
      matchCount++;
      matchedKeywords.push(keyword);
    }
  }

  // Strong match: multiple nautical keywords
  if (matchCount >= 2) {
    return {
      isOnTopic: true,
      confidence: 'certain',
      reason: `Matched ${matchCount} nautical keywords: ${matchedKeywords.slice(0, 5).join(', ')}`,
    };
  }

  // Single keyword match: likely on-topic
  if (matchCount === 1) {
    return {
      isOnTopic: true,
      confidence: 'likely',
      reason: `Matched keyword: ${matchedKeywords[0]}`,
    };
  }

  // No keywords matched
  // Short messages (greetings, etc.) are ambiguous — let them through
  if (lower.length < 20) {
    return {
      isOnTopic: true,
      confidence: 'ambiguous',
      reason: 'Short message, allowing through',
    };
  }

  // Longer messages with no nautical keywords — likely off-topic
  return {
    isOnTopic: false,
    confidence: 'likely',
    reason: 'No nautical keywords found in longer message',
  };
}

/**
 * Returns the standard off-topic response message.
 */
export function getOffTopicResponse(): string {
  return "I'm NauticFinder's boat expert assistant. I can help you find boats, compare models, understand specifications, and navigate the boat buying process. Could you ask me something about boats or yachts?";
}
