import { describe, it, expect } from 'vitest';
import { normalizeLength } from '../../../src/scraping/normalizers/length.normalizer.js';

describe('normalizeLength', () => {
  it('handles null/undefined/empty', () => {
    expect(normalizeLength(null)).toBeNull();
    expect(normalizeLength(undefined)).toBeNull();
    expect(normalizeLength('')).toBeNull();
  });

  it('parses feet with ft suffix', () => {
    expect(normalizeLength('38ft')).toBe('38');
    expect(normalizeLength('38 ft')).toBe('38');
    expect(normalizeLength('38.5ft')).toBe('38.5');
  });

  it('parses feet with apostrophe', () => {
    expect(normalizeLength("38'")).toBe('38');
  });

  it('parses feet with "feet" word', () => {
    expect(normalizeLength('38 feet')).toBe('38');
  });

  it('parses feet and inches', () => {
    expect(normalizeLength('38\' 6"')).toBe('38.5');
    expect(normalizeLength('38ft 6in')).toBe('38.5');
    expect(normalizeLength('40 ft 3 in')).toBe('40.25');
  });

  it('converts metres to feet', () => {
    const result = normalizeLength('11.6m');
    expect(result).not.toBeNull();
    // 11.6m * 3.28084 = ~38.06
    expect(parseFloat(result!)).toBeCloseTo(38.06, 0);
  });

  it('handles metres with comma decimal (European)', () => {
    const result = normalizeLength('11,6m');
    expect(result).not.toBeNull();
    expect(parseFloat(result!)).toBeCloseTo(38.06, 0);
  });

  it('handles "metres" spelled out', () => {
    const result = normalizeLength('11.6 metres');
    expect(result).not.toBeNull();
    expect(parseFloat(result!)).toBeCloseTo(38.06, 0);
  });

  it('handles "meters" American spelling', () => {
    const result = normalizeLength('11.6 meters');
    expect(result).not.toBeNull();
    expect(parseFloat(result!)).toBeCloseTo(38.06, 0);
  });

  it('guesses metres for small numbers (<=30)', () => {
    const result = normalizeLength('12');
    expect(result).not.toBeNull();
    // 12m * 3.28084 = ~39.37
    expect(parseFloat(result!)).toBeCloseTo(39.37, 0);
  });

  it('guesses feet for large numbers (>30)', () => {
    expect(normalizeLength('42')).toBe('42');
  });

  it('handles junk input gracefully', () => {
    expect(normalizeLength('N/A')).toBeNull();
    expect(normalizeLength('unknown')).toBeNull();
  });
});
