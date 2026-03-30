import { describe, it, expect } from 'vitest';
import { buildEmbeddingText } from '../../../src/scraping/normalizers/embedding-text.js';

describe('buildEmbeddingText', () => {
  it('builds text from full listing data', () => {
    const text = buildEmbeddingText({
      year: 2018,
      make: 'Bavaria',
      modelName: 'Cruiser 38',
      boatType: 'sailboat',
      price: '85000',
      currency: 'EUR',
      lengthFt: '38',
      hullMaterial: 'fiberglass',
      cabins: 3,
      berths: 6,
      country: 'Greece',
      city: 'Athens',
      features: ['autopilot', 'bimini', 'bow thruster'],
      description: 'Well maintained sailing yacht in excellent condition.',
    });

    expect(text).toContain('2018 Bavaria Cruiser 38');
    expect(text).toContain('sailboat');
    expect(text).toContain('EUR 85000');
    expect(text).toContain('38ft');
    expect(text).toContain('fiberglass hull');
    expect(text).toContain('3 cabins');
    expect(text).toContain('Athens');
    expect(text).toContain('Greece');
    expect(text).toContain('autopilot');
    expect(text).toContain('excellent condition');
  });

  it('uses title as fallback when year/make/model missing', () => {
    const text = buildEmbeddingText({
      title: 'Beautiful 40ft Sailboat',
      boatType: 'sailboat',
    });

    expect(text).toContain('Beautiful 40ft Sailboat');
  });

  it('handles minimal data gracefully', () => {
    const text = buildEmbeddingText({});
    expect(text).toBe('');
  });

  it('truncates long descriptions', () => {
    const longDesc = 'x'.repeat(1000);
    const text = buildEmbeddingText({ description: longDesc });
    expect(text.length).toBeLessThan(600);
  });

  it('limits features to 15', () => {
    const features = Array.from({ length: 30 }, (_, i) => `feature-${i}`);
    const text = buildEmbeddingText({ features });
    // Should only contain first 15
    expect(text).toContain('feature-14');
    expect(text).not.toContain('feature-15');
  });
});
