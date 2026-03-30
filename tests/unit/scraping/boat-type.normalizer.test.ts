import { describe, it, expect } from 'vitest';
import { normalizeBoatType } from '../../../src/scraping/normalizers/boat-type.normalizer.js';

describe('normalizeBoatType', () => {
  it('handles null/undefined/empty', () => {
    expect(normalizeBoatType(null)).toBe('other');
    expect(normalizeBoatType(undefined)).toBe('other');
    expect(normalizeBoatType('')).toBe('other');
  });

  it('normalizes sailboat variations', () => {
    expect(normalizeBoatType('Sailboat')).toBe('sailboat');
    expect(normalizeBoatType('Sailing Yacht')).toBe('sailboat');
    expect(normalizeBoatType('sailing')).toBe('sailboat');
    expect(normalizeBoatType('Voilier')).toBe('sailboat');
    expect(normalizeBoatType('Sloop')).toBe('sailboat');
    expect(normalizeBoatType('Ketch')).toBe('sailboat');
  });

  it('normalizes motorboat variations', () => {
    expect(normalizeBoatType('Motorboat')).toBe('motorboat');
    expect(normalizeBoatType('Motor Yacht')).toBe('motorboat');
    expect(normalizeBoatType('Power Boat')).toBe('motorboat');
    expect(normalizeBoatType('Cruiser')).toBe('motorboat');
    expect(normalizeBoatType('Flybridge')).toBe('motorboat');
    expect(normalizeBoatType('Express Cruiser')).toBe('motorboat');
  });

  it('normalizes catamaran before sailboat', () => {
    expect(normalizeBoatType('Sailing Catamaran')).toBe('catamaran');
    expect(normalizeBoatType('Catamaran')).toBe('catamaran');
    expect(normalizeBoatType('Multihull')).toBe('catamaran');
  });

  it('normalizes trawler', () => {
    expect(normalizeBoatType('Trawler')).toBe('trawler');
  });

  it('normalizes center console', () => {
    expect(normalizeBoatType('Center Console')).toBe('center-console');
    expect(normalizeBoatType('Centre Console')).toBe('center-console');
  });

  it('normalizes jet ski', () => {
    expect(normalizeBoatType('Jet Ski')).toBe('jet-ski');
    expect(normalizeBoatType('PWC')).toBe('jet-ski');
    expect(normalizeBoatType('Personal Watercraft')).toBe('jet-ski');
  });

  it('normalizes dinghy/inflatable', () => {
    expect(normalizeBoatType('Dinghy')).toBe('dinghy');
    expect(normalizeBoatType('RIB')).toBe('dinghy');
    expect(normalizeBoatType('Inflatable')).toBe('dinghy');
  });

  it('normalizes houseboat', () => {
    expect(normalizeBoatType('Houseboat')).toBe('houseboat');
  });

  it('returns canonical type if already valid', () => {
    expect(normalizeBoatType('sailboat')).toBe('sailboat');
    expect(normalizeBoatType('motorboat')).toBe('motorboat');
  });

  it('returns other for unknown types', () => {
    expect(normalizeBoatType('submarine')).toBe('other');
    expect(normalizeBoatType('spaceship')).toBe('other');
  });
});
