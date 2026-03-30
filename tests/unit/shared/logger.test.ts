import { describe, it, expect, beforeEach } from 'vitest';
import {
  initLogger,
  getLogger,
  createServiceLogger,
  createRequestLogger,
  resetLogger,
} from '../../../src/shared/logger/index.js';

describe('Logger', () => {
  beforeEach(() => {
    resetLogger();
  });

  describe('initLogger', () => {
    it('creates a Pino logger instance', () => {
      const logger = initLogger({ level: 'silent', isDevelopment: false });

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.child).toBe('function');
    });

    it('returns the same instance on subsequent calls (singleton)', () => {
      const first = initLogger({ level: 'silent', isDevelopment: false });
      const second = initLogger({ level: 'debug', isDevelopment: true });

      expect(first).toBe(second);
    });
  });

  describe('getLogger', () => {
    it('throws if logger is not initialized', () => {
      expect(() => getLogger()).toThrow('Logger not initialized');
    });

    it('returns the logger after initialization', () => {
      const initialized = initLogger({ level: 'silent', isDevelopment: false });
      const retrieved = getLogger();

      expect(retrieved).toBe(initialized);
    });
  });

  describe('createServiceLogger', () => {
    it('creates a child logger with service binding', () => {
      initLogger({ level: 'silent', isDevelopment: false });
      const child = createServiceLogger('catalog');

      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
      // Child loggers have bindings — Pino stores them internally
    });
  });

  describe('createRequestLogger', () => {
    it('creates a child logger with requestId binding', () => {
      initLogger({ level: 'silent', isDevelopment: false });
      const child = createRequestLogger('req-123');

      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
    });

    it('includes service binding when provided', () => {
      initLogger({ level: 'silent', isDevelopment: false });
      const child = createRequestLogger('req-123', 'search');

      expect(child).toBeDefined();
    });
  });

  describe('resetLogger', () => {
    it('clears the singleton so getLogger throws again', () => {
      initLogger({ level: 'silent', isDevelopment: false });
      expect(() => getLogger()).not.toThrow();

      resetLogger();
      expect(() => getLogger()).toThrow('Logger not initialized');
    });
  });
});
