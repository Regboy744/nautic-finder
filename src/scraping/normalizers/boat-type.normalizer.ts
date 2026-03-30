/**
 * Boat type normalizer — maps raw boat type strings to canonical values.
 *
 * Handles variations like:
 * - "Sailing Yacht" / "Sailboat" / "Voilier" → "sailboat"
 * - "Motor Yacht" / "Motorboat" / "Power Boat" → "motorboat"
 * - "Sailing Catamaran" / "Catamaran" → "catamaran"
 * - etc.
 */

import { BOAT_TYPES, type BoatType } from '../../shared/constants/index.js';

/** Maps lowercase keywords to canonical boat types. Order matters — first match wins. */
const TYPE_KEYWORDS: Array<[string[], BoatType]> = [
  // Catamaran before sailboat (sailing catamaran should map to catamaran)
  [['catamaran', 'multihull', 'trimaran'], 'catamaran'],
  // Sailboat
  [
    ['sailboat', 'sailing', 'voilier', 'sloop', 'ketch', 'yawl', 'schooner', 'cutter', 'sail'],
    'sailboat',
  ],
  // Trawler before motorboat (trawler is a specific motorboat type)
  [['trawler'], 'trawler'],
  // Center console
  [['center console', 'centre console', 'center-console'], 'center-console'],
  // Pontoon
  [['pontoon'], 'pontoon'],
  // Jet ski
  [['jet ski', 'jetski', 'pwc', 'personal watercraft', 'waverunner'], 'jet-ski'],
  // Dinghy
  [['dinghy', 'tender', 'inflatable', 'rib'], 'dinghy'],
  // Houseboat
  [['houseboat', 'house boat', 'floating home'], 'houseboat'],
  // Motorboat (general — must be after specific motor types)
  [
    [
      'motorboat',
      'motor boat',
      'motor yacht',
      'powerboat',
      'power boat',
      'motor',
      'cruiser',
      'sportfish',
      'flybridge',
      'express',
      'bowrider',
      'runabout',
      'cabin cruiser',
      'sport fish',
      'walkaround',
      'cuddy',
    ],
    'motorboat',
  ],
];

/**
 * Normalizes a raw boat type string to a canonical BoatType value.
 * Returns 'other' if no match is found.
 */
export function normalizeBoatType(raw: string | undefined | null): BoatType {
  if (!raw || raw.trim().length === 0) return 'other';

  const lower = raw.trim().toLowerCase();

  for (const [keywords, type] of TYPE_KEYWORDS) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return type;
    }
  }

  // Check if it's already a valid boat type
  if (BOAT_TYPES.includes(lower as BoatType)) return lower as BoatType;

  return 'other';
}
