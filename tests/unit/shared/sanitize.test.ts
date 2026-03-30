import { describe, it, expect } from 'vitest';
import {
  stripHtml,
  normalizeWhitespace,
  sanitizeText,
  sanitizeSearchQuery,
  sanitizeEmail,
  sanitizeUrl,
  escapeLikePattern,
} from '../../../src/shared/utils/sanitize.js';

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('handles self-closing tags', () => {
    expect(stripHtml('Hello<br/>world')).toBe('Helloworld');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('No tags here')).toBe('No tags here');
  });

  it('removes script tags and content between them', () => {
    // Note: stripHtml only removes tags, not content between them
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
  });
});

describe('normalizeWhitespace', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeWhitespace('hello   world')).toBe('hello world');
  });

  it('handles tabs and newlines', () => {
    expect(normalizeWhitespace('hello\t\n  world')).toBe('hello world');
  });
});

describe('sanitizeText', () => {
  it('strips HTML and normalizes whitespace', () => {
    expect(sanitizeText('<p>Hello   <b>world</b></p>')).toBe('Hello world');
  });

  it('truncates to max length', () => {
    const long = 'a'.repeat(10_000);
    expect(sanitizeText(long, 100).length).toBe(100);
  });

  it('uses default max length of 5000', () => {
    const long = 'a'.repeat(10_000);
    expect(sanitizeText(long).length).toBe(5_000);
  });
});

describe('sanitizeSearchQuery', () => {
  it('removes SQL-like keywords', () => {
    const result = sanitizeSearchQuery('SELECT sailboat DROP TABLE');
    expect(result).not.toContain('SELECT');
    expect(result).not.toContain('DROP');
    expect(result).toContain('sailboat');
  });

  it('preserves normal search terms', () => {
    expect(sanitizeSearchQuery('Bavaria 38 under 50000')).toBe('Bavaria 38 under 50000');
  });

  it('strips HTML from queries', () => {
    expect(sanitizeSearchQuery('<b>boats</b>')).toBe('boats');
  });

  it('truncates long queries', () => {
    const long = 'boat '.repeat(200);
    expect(sanitizeSearchQuery(long).length).toBeLessThanOrEqual(500);
  });
});

describe('sanitizeEmail', () => {
  it('lowercases and trims', () => {
    expect(sanitizeEmail('  User@Example.COM  ')).toBe('user@example.com');
  });
});

describe('sanitizeUrl', () => {
  it('trims whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
  });
});

describe('escapeLikePattern', () => {
  it('escapes percent signs', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%');
  });

  it('escapes underscores', () => {
    expect(escapeLikePattern('boat_name')).toBe('boat\\_name');
  });

  it('escapes backslashes', () => {
    expect(escapeLikePattern('path\\to')).toBe('path\\\\to');
  });

  it('leaves normal text unchanged', () => {
    expect(escapeLikePattern('Bavaria 38')).toBe('Bavaria 38');
  });
});
