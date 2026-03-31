import { describe, it, expect, beforeEach } from 'vitest';
import {
  BROWSER_PROFILES,
  buildStealthHeaders,
  getRandomProfile,
} from '../../../src/scraping/stealth/headers.js';
import { CookieJar } from '../../../src/scraping/stealth/cookies.js';

describe('Stealth Headers', () => {
  describe('BROWSER_PROFILES', () => {
    it('has at least 10 profiles', () => {
      expect(BROWSER_PROFILES.length).toBeGreaterThanOrEqual(10);
    });

    it('every profile has a unique id', () => {
      const ids = BROWSER_PROFILES.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every profile has essential headers', () => {
      for (const profile of BROWSER_PROFILES) {
        expect(profile.headers['User-Agent']).toBeTruthy();
        expect(profile.headers['Accept']).toBeTruthy();
        expect(profile.headers['Accept-Encoding']).toBeTruthy();
        expect(profile.headers['Accept-Language']).toBeTruthy();
        expect(profile.headers['Connection']).toBe('keep-alive');
        expect(profile.headers['Sec-Fetch-Dest']).toBe('document');
        expect(profile.headers['Sec-Fetch-Mode']).toBe('navigate');
        expect(profile.headers['Upgrade-Insecure-Requests']).toBe('1');
      }
    });

    it('Chrome profiles include Sec-Ch-Ua headers', () => {
      const chromeProfiles = BROWSER_PROFILES.filter((p) => p.id.startsWith('chrome'));
      expect(chromeProfiles.length).toBeGreaterThan(0);

      for (const profile of chromeProfiles) {
        expect(profile.headers['Sec-Ch-Ua']).toBeTruthy();
        expect(profile.headers['Sec-Ch-Ua-Mobile']).toBe('?0');
        expect(profile.headers['Sec-Ch-Ua-Platform']).toBeTruthy();
      }
    });

    it('Firefox profiles do NOT include Sec-Ch-Ua headers', () => {
      const firefoxProfiles = BROWSER_PROFILES.filter((p) => p.id.startsWith('firefox'));
      expect(firefoxProfiles.length).toBeGreaterThan(0);

      for (const profile of firefoxProfiles) {
        expect(profile.headers['Sec-Ch-Ua']).toBeUndefined();
      }
    });
  });

  describe('getRandomProfile', () => {
    it('returns a valid profile', () => {
      const profile = getRandomProfile();
      expect(profile.id).toBeTruthy();
      expect(profile.headers['User-Agent']).toBeTruthy();
    });
  });

  describe('buildStealthHeaders', () => {
    it('includes profile headers', () => {
      const profile = BROWSER_PROFILES[0];
      const headers = buildStealthHeaders(profile);

      expect(headers['User-Agent']).toBe(profile.headers['User-Agent']);
      expect(headers['Accept']).toBe(profile.headers['Accept']);
    });

    it('adds Referer when provided', () => {
      const profile = BROWSER_PROFILES[0];
      const headers = buildStealthHeaders(profile, { referer: 'https://www.google.com/' });

      expect(headers['Referer']).toBe('https://www.google.com/');
    });

    it('adds Cookie when provided', () => {
      const profile = BROWSER_PROFILES[0];
      const headers = buildStealthHeaders(profile, { cookie: 'cf_clearance=abc123' });

      expect(headers['Cookie']).toBe('cf_clearance=abc123');
    });

    it('broker headers override profile headers', () => {
      const profile = BROWSER_PROFILES[0];
      const customUA = 'CustomBot/1.0';
      const headers = buildStealthHeaders(profile, {
        brokerHeaders: { 'User-Agent': customUA },
      });

      expect(headers['User-Agent']).toBe(customUA);
    });
  });
});

describe('CookieJar', () => {
  let jar: CookieJar;

  beforeEach(() => {
    jar = new CookieJar();
  });

  it('starts empty', () => {
    expect(jar.size).toBe(0);
    expect(jar.getCookieHeader('https://example.com')).toBeUndefined();
  });

  it('stores and retrieves cookies', () => {
    jar.addFromResponse('https://example.com/page', ['session=abc123; Path=/']);

    const header = jar.getCookieHeader('https://example.com/other');
    expect(header).toBe('session=abc123');
    expect(jar.size).toBe(1);
  });

  it('handles multiple cookies', () => {
    jar.addFromResponse('https://example.com/', ['a=1; Path=/', 'b=2; Path=/']);

    const header = jar.getCookieHeader('https://example.com/page');
    expect(header).toContain('a=1');
    expect(header).toContain('b=2');
    expect(jar.size).toBe(2);
  });

  it('respects domain matching', () => {
    jar.addFromResponse('https://sub.example.com/', ['token=xyz; Domain=example.com; Path=/']);

    // Should match on example.com and sub.example.com
    expect(jar.getCookieHeader('https://example.com/')).toBe('token=xyz');
    expect(jar.getCookieHeader('https://sub.example.com/')).toBe('token=xyz');

    // Should not match unrelated domain
    expect(jar.getCookieHeader('https://other.com/')).toBeUndefined();
  });

  it('respects path matching', () => {
    jar.addFromResponse('https://example.com/', ['admin=true; Path=/admin']);

    expect(jar.getCookieHeader('https://example.com/admin/dashboard')).toBe('admin=true');
    expect(jar.getCookieHeader('https://example.com/public')).toBeUndefined();
  });

  it('respects Secure flag', () => {
    jar.addFromResponse('https://example.com/', ['secure_token=abc; Secure; Path=/']);

    expect(jar.getCookieHeader('https://example.com/')).toBe('secure_token=abc');
    expect(jar.getCookieHeader('http://example.com/')).toBeUndefined();
  });

  it('respects Max-Age expiry', () => {
    // Expired cookie (0 seconds)
    jar.addFromResponse('https://example.com/', ['expired=old; Max-Age=0; Path=/']);

    expect(jar.getCookieHeader('https://example.com/')).toBeUndefined();
  });

  it('replaces cookies with same name/domain/path', () => {
    jar.addFromResponse('https://example.com/', ['token=old; Path=/']);
    jar.addFromResponse('https://example.com/', ['token=new; Path=/']);

    expect(jar.getCookieHeader('https://example.com/')).toBe('token=new');
    expect(jar.size).toBe(1);
  });

  it('clears all cookies', () => {
    jar.addFromResponse('https://example.com/', ['a=1; Path=/', 'b=2; Path=/']);
    expect(jar.size).toBe(2);

    jar.clear();
    expect(jar.size).toBe(0);
    expect(jar.getCookieHeader('https://example.com/')).toBeUndefined();
  });

  it('handles cf_clearance cookies from Cloudflare', () => {
    jar.addFromResponse('https://www.yachtworld.com/', [
      'cf_clearance=abc123def456; Path=/; Domain=.yachtworld.com; Secure; HttpOnly; SameSite=None',
    ]);

    expect(jar.getCookieHeader('https://www.yachtworld.com/boats-for-sale')).toBe(
      'cf_clearance=abc123def456',
    );
  });
});
