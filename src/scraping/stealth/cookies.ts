/**
 * Simple in-memory cookie jar for per-session cookie persistence.
 *
 * Parses Set-Cookie headers from responses and forwards them on
 * subsequent requests to the same domain. This is critical for
 * maintaining Cloudflare cf_clearance and similar anti-bot cookies.
 */

interface CookieEntry {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  secure: boolean;
  httpOnly: boolean;
}

export class CookieJar {
  private cookies: CookieEntry[] = [];

  /**
   * Parse and store cookies from a response's Set-Cookie header(s).
   */
  addFromResponse(url: string, setCookieHeaders: string[]): void {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    for (const header of setCookieHeaders) {
      const entry = this.parseSetCookie(header, domain);
      if (entry) {
        // Remove existing cookie with same name+domain+path
        this.cookies = this.cookies.filter(
          (c) => !(c.name === entry.name && c.domain === entry.domain && c.path === entry.path),
        );
        this.cookies.push(entry);
      }
    }
  }

  /**
   * Get the Cookie header value for a given URL.
   * Returns undefined if no cookies match.
   */
  getCookieHeader(url: string): string | undefined {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    const path = parsed.pathname;
    const isSecure = parsed.protocol === 'https:';
    const now = new Date();

    const matching = this.cookies.filter((c) => {
      // Domain match (exact or subdomain)
      if (!domain.endsWith(c.domain) && domain !== c.domain) return false;
      // Path match
      if (!path.startsWith(c.path)) return false;
      // Secure check
      if (c.secure && !isSecure) return false;
      // Expiry check
      if (c.expires && c.expires < now) return false;
      return true;
    });

    if (matching.length === 0) return undefined;

    return matching.map((c) => `${c.name}=${c.value}`).join('; ');
  }

  /** Clear all stored cookies. */
  clear(): void {
    this.cookies = [];
  }

  /** Number of stored cookies (for testing/logging). */
  get size(): number {
    return this.cookies.length;
  }

  private parseSetCookie(header: string, defaultDomain: string): CookieEntry | null {
    const parts = header.split(';').map((p) => p.trim());
    const nameValue = parts[0];
    if (!nameValue) return null;

    const eqIndex = nameValue.indexOf('=');
    if (eqIndex === -1) return null;

    const name = nameValue.slice(0, eqIndex).trim();
    const value = nameValue.slice(eqIndex + 1).trim();
    if (!name) return null;

    const entry: CookieEntry = {
      name,
      value,
      domain: defaultDomain,
      path: '/',
      secure: false,
      httpOnly: false,
    };

    for (let i = 1; i < parts.length; i++) {
      const attr = parts[i];
      const attrLower = attr.toLowerCase();

      if (attrLower.startsWith('domain=')) {
        let domain = attr.slice(7).trim();
        // Remove leading dot (RFC 6265)
        if (domain.startsWith('.')) domain = domain.slice(1);
        entry.domain = domain;
      } else if (attrLower.startsWith('path=')) {
        entry.path = attr.slice(5).trim();
      } else if (attrLower.startsWith('expires=')) {
        const date = new Date(attr.slice(8).trim());
        if (!isNaN(date.getTime())) entry.expires = date;
      } else if (attrLower.startsWith('max-age=')) {
        const seconds = parseInt(attr.slice(8).trim(), 10);
        if (!isNaN(seconds)) {
          // Max-Age=0 means the cookie is expired immediately
          entry.expires = seconds <= 0 ? new Date(0) : new Date(Date.now() + seconds * 1000);
        }
      } else if (attrLower === 'secure') {
        entry.secure = true;
      } else if (attrLower === 'httponly') {
        entry.httpOnly = true;
      }
    }

    return entry;
  }
}
