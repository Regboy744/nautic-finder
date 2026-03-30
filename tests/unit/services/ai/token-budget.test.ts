import { describe, it, expect, beforeEach } from 'vitest';
import { createTokenBudget } from '../../../../src/services/ai/token-budget.js';

describe('TokenBudget', () => {
  let budget: ReturnType<typeof createTokenBudget>;

  beforeEach(() => {
    budget = createTokenBudget({ dailyLimitUsd: 1, monthlyLimitUsd: 10 });
  });

  describe('record', () => {
    it('records usage and returns estimated cost', () => {
      const cost = budget.record('gemini', 1000, 500);
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('tracks cumulative spend in stats', () => {
      budget.record('gemini', 1000, 500);
      budget.record('claude', 500, 200);

      const stats = budget.getStats();
      expect(stats.dailySpendUsd).toBeGreaterThan(0);
      expect(stats.totalRecords).toBe(2);
    });
  });

  describe('canSpend', () => {
    it('allows spending when under budget', () => {
      const result = budget.canSpend();
      expect(result.allowed).toBe(true);
    });

    it('blocks when daily limit is exceeded', () => {
      // Record enough Claude tokens to exceed $1 daily limit
      // Claude: $3/M input, $15/M output
      // 100K output tokens = $1.50 — exceeds $1 limit
      budget.record('claude', 0, 100_000);

      const result = budget.canSpend();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily budget');
    });
  });

  describe('getStats', () => {
    it('returns current usage stats', () => {
      const stats = budget.getStats();

      expect(stats.dailySpendUsd).toBe(0);
      expect(stats.monthlySpendUsd).toBe(0);
      expect(stats.totalRecords).toBe(0);
      expect(stats.limits.dailyLimitUsd).toBe(1);
      expect(stats.limits.monthlyLimitUsd).toBe(10);
    });
  });

  describe('reset', () => {
    it('clears all records', () => {
      budget.record('gemini', 1000, 500);
      expect(budget.getStats().totalRecords).toBe(1);

      budget.reset();
      expect(budget.getStats().totalRecords).toBe(0);
    });
  });
});
