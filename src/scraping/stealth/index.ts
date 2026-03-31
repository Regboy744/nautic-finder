/**
 * Stealth module — anti-bot evasion utilities for the scraping engine.
 */

export { BROWSER_PROFILES, buildStealthHeaders, getRandomProfile } from './headers.js';
export type { BrowserProfile } from './headers.js';
export { CookieJar } from './cookies.js';
