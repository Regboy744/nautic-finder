import { describe, it, expect, beforeEach } from 'vitest';
import { ProxyService } from '../../../src/shared/services/proxy/proxy.service.js';
import type { AppConfig } from '../../../src/config/env.js';
import { createTestConfig } from '../../helpers/test-server.js';

function createProxyConfig(overrides?: Partial<AppConfig['proxy']>): AppConfig {
  return createTestConfig({
    proxy: {
      enabled: true,
      mode: 'userpass',
      host: 'ie.decodo.com',
      port: 24001,
      username: 'user-sprxq1u38t',
      password: '3gOu2fz=2kmHul4CSt',
      protocol: 'https',
      country: '',
      sessionStrategy: 'rotate',
      sessionDurationMin: 30,
      sessionIdStrategy: 'per_job',
      timeoutMs: 30000,
      ...overrides,
    },
  });
}

describe('ProxyService', () => {
  let service: ProxyService;

  beforeEach(() => {
    service = new ProxyService(createProxyConfig());
    service.clearSessions();
    service.clearAgentCache();
  });

  describe('buildCredentials', () => {
    it('builds credentials in userpass mode with rotate strategy', () => {
      const creds = service.buildCredentials();

      expect(creds.serverArg).toBe('ie.decodo.com:24001');
      expect(creds.requiresAuth).toBe(true);
      expect(creds.username).toBe('user-sprxq1u38t');
      expect(creds.password).toBe('3gOu2fz=2kmHul4CSt');
      expect(creds.url).toContain('https://');
      expect(creds.url).toContain('ie.decodo.com:24001');
    });

    it('builds credentials in sticky mode with session ID and duration', () => {
      const stickyService = new ProxyService(createProxyConfig({ sessionStrategy: 'sticky' }));

      const creds = stickyService.buildCredentials({ brokerKey: 'test-broker', jobId: 'job-1' });

      expect(creds.username).toContain('-sessionduration-30');
      expect(creds.username).toContain('-session-');
      expect(creds.requiresAuth).toBe(true);
    });

    it('appends country when specified', () => {
      const creds = service.buildCredentials({ country: 'US' });

      // Rotate mode, no session params, but country appended
      expect(creds.username).toContain('-country-US');
    });

    it('builds ip_whitelist credentials without auth', () => {
      const ipService = new ProxyService(createProxyConfig({ mode: 'ip_whitelist' }));
      const creds = ipService.buildCredentials();

      expect(creds.requiresAuth).toBe(false);
      expect(creds.username).toBeUndefined();
      expect(creds.password).toBeUndefined();
      expect(creds.url).toBe('https://ie.decodo.com:24001');
    });

    it('throws when proxy is disabled', () => {
      const disabledService = new ProxyService(createProxyConfig({ enabled: false }));

      expect(() => disabledService.buildCredentials()).toThrow('proxy is disabled');
    });
  });

  describe('buildCredentialsForBroker', () => {
    it('uses broker policy from the central map', () => {
      // YachtWorld is configured with rotate in brokerProxyPolicies
      const creds = service.buildCredentialsForBroker('YachtWorld');

      expect(creds.requiresAuth).toBe(true);
      expect(creds.serverArg).toBe('ie.decodo.com:24001');
    });

    it('falls back to global config for unknown broker', () => {
      const creds = service.buildCredentialsForBroker('UnknownBroker');

      expect(creds.requiresAuth).toBe(true);
      expect(creds.serverArg).toBe('ie.decodo.com:24001');
    });
  });

  describe('isEnabled', () => {
    it('returns true when proxy is enabled', () => {
      expect(service.isEnabled).toBe(true);
    });

    it('returns false when proxy is disabled', () => {
      const disabled = new ProxyService(createProxyConfig({ enabled: false }));
      expect(disabled.isEnabled).toBe(false);
    });
  });

  describe('getConfigSummary', () => {
    it('returns safe summary without secrets', () => {
      const summary = service.getConfigSummary();

      expect(summary.enabled).toBe(true);
      expect(summary.mode).toBe('userpass');
      expect(summary.endpoint).toContain('ie.decodo.com:24001');
      expect(summary.endpoint).toContain('***');
      // Password should never appear
      expect(JSON.stringify(summary)).not.toContain('3gOu2fz');
    });
  });

  describe('getHttpAgent', () => {
    it('returns an HttpsProxyAgent', () => {
      const agent = service.getHttpAgent();
      expect(agent).toBeDefined();
      expect(agent.constructor.name).toBe('HttpsProxyAgent');
    });

    it('caches agents by proxy URL', () => {
      const agent1 = service.getHttpAgent();
      const agent2 = service.getHttpAgent();
      expect(agent1).toBe(agent2);
    });

    it('throws when proxy is disabled', () => {
      const disabled = new ProxyService(createProxyConfig({ enabled: false }));
      expect(() => disabled.getHttpAgent()).toThrow('proxy is disabled');
    });
  });

  describe('session management', () => {
    it('generates consistent session IDs per broker in sticky mode', () => {
      const stickyService = new ProxyService(
        createProxyConfig({ sessionStrategy: 'sticky', sessionIdStrategy: 'per_broker' }),
      );

      const creds1 = stickyService.buildCredentials({ brokerKey: 'YachtWorld' });
      const creds2 = stickyService.buildCredentials({ brokerKey: 'YachtWorld' });

      // Same broker key should get same session ID
      expect(creds1.username).toBe(creds2.username);
    });

    it('clears sessions', () => {
      const stickyService = new ProxyService(
        createProxyConfig({ sessionStrategy: 'sticky', sessionIdStrategy: 'per_broker' }),
      );

      const creds1 = stickyService.buildCredentials({ brokerKey: 'YachtWorld' });
      stickyService.clearSessions();
      const creds2 = stickyService.buildCredentials({ brokerKey: 'YachtWorld' });

      // After clearing, a new session ID should be generated
      expect(creds1.username).not.toBe(creds2.username);
    });
  });
});
