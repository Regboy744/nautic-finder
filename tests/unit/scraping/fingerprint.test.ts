import { describe, it, expect } from 'vitest';
import { generateFingerprint } from '../../../src/scraping/normalizers/fingerprint.js';

describe('generateFingerprint', () => {
  it('generates a consistent hash for the same inputs', () => {
    const a = generateFingerprint({
      make: 'Bavaria',
      modelName: 'Cruiser 38',
      year: 2018,
      lengthFt: '38',
      country: 'Greece',
    });
    const b = generateFingerprint({
      make: 'Bavaria',
      modelName: 'Cruiser 38',
      year: 2018,
      lengthFt: '38',
      country: 'Greece',
    });
    expect(a).toBe(b);
  });

  it('is case-insensitive for make, model, country', () => {
    const a = generateFingerprint({ make: 'Bavaria', modelName: 'Cruiser 38', year: 2018 });
    const b = generateFingerprint({ make: 'bavaria', modelName: 'cruiser 38', year: 2018 });
    expect(a).toBe(b);
  });

  it('produces different hashes for different boats', () => {
    const a = generateFingerprint({ make: 'Bavaria', modelName: 'Cruiser 38', year: 2018 });
    const b = generateFingerprint({ make: 'Beneteau', modelName: 'Oceanis 40', year: 2019 });
    expect(a).not.toBe(b);
  });

  it('produces a 16-character hex string', () => {
    const hash = generateFingerprint({ make: 'Bavaria', modelName: 'Cruiser 38' });
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('handles missing fields gracefully', () => {
    const hash = generateFingerprint({});
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });
});
