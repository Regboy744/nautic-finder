/**
 * Token budget — tracks AI usage and enforces cost limits.
 * Prevents runaway costs by capping daily/monthly token usage.
 */

import type { AiProvider } from './types.js';

/** Approximate cost per 1M tokens for each provider (USD). */
const COST_PER_MILLION_TOKENS: Record<AiProvider, { input: number; output: number }> = {
  gemini: { input: 0.075, output: 0.3 }, // Gemini 2.0 Flash
  claude: { input: 3.0, output: 15.0 }, // Claude Sonnet
  openai: { input: 0.02, output: 0.02 }, // text-embedding-3-small
};

/** Token usage record. */
interface UsageRecord {
  provider: AiProvider;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  timestamp: number;
}

/** Budget limits. */
export interface BudgetLimits {
  /** Max daily spend in USD. Default: $10. */
  dailyLimitUsd: number;
  /** Max monthly spend in USD. Default: $200. */
  monthlyLimitUsd: number;
}

const DEFAULT_LIMITS: BudgetLimits = {
  dailyLimitUsd: 10,
  monthlyLimitUsd: 200,
};

/**
 * Creates a token budget tracker.
 * In-memory for now — could be backed by Redis for distributed tracking.
 */
export function createTokenBudget(limits: Partial<BudgetLimits> = {}) {
  const config: BudgetLimits = { ...DEFAULT_LIMITS, ...limits };
  const records: UsageRecord[] = [];

  /**
   * Estimates the cost of a token usage.
   */
  function estimateCost(provider: AiProvider, inputTokens: number, outputTokens: number): number {
    const rates = COST_PER_MILLION_TOKENS[provider];
    return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
  }

  /**
   * Gets the total spend within a time window.
   */
  function getSpendSince(sinceMs: number): number {
    return records
      .filter((r) => r.timestamp >= sinceMs)
      .reduce((sum, r) => sum + r.estimatedCostUsd, 0);
  }

  return {
    /**
     * Records token usage and returns the estimated cost.
     */
    record(provider: AiProvider, inputTokens: number, outputTokens: number): number {
      const cost = estimateCost(provider, inputTokens, outputTokens);
      records.push({
        provider,
        inputTokens,
        outputTokens,
        estimatedCostUsd: cost,
        timestamp: Date.now(),
      });
      return cost;
    },

    /**
     * Checks if the budget allows a request.
     * Returns true if within limits, false if budget exhausted.
     */
    canSpend(): { allowed: boolean; reason?: string } {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      const dailySpend = getSpendSince(oneDayAgo);
      if (dailySpend >= config.dailyLimitUsd) {
        return {
          allowed: false,
          reason: `Daily budget exhausted ($${dailySpend.toFixed(2)}/$${config.dailyLimitUsd})`,
        };
      }

      const monthlySpend = getSpendSince(thirtyDaysAgo);
      if (monthlySpend >= config.monthlyLimitUsd) {
        return {
          allowed: false,
          reason: `Monthly budget exhausted ($${monthlySpend.toFixed(2)}/$${config.monthlyLimitUsd})`,
        };
      }

      return { allowed: true };
    },

    /**
     * Returns current usage stats.
     */
    getStats(): {
      dailySpendUsd: number;
      monthlySpendUsd: number;
      totalRecords: number;
      limits: BudgetLimits;
    } {
      const now = Date.now();
      return {
        dailySpendUsd: Math.round(getSpendSince(now - 24 * 60 * 60 * 1000) * 10000) / 10000,
        monthlySpendUsd: Math.round(getSpendSince(now - 30 * 24 * 60 * 60 * 1000) * 10000) / 10000,
        totalRecords: records.length,
        limits: config,
      };
    },

    /**
     * Clears all records. For testing only.
     * @internal
     */
    reset(): void {
      records.length = 0;
    },
  };
}

export type TokenBudget = ReturnType<typeof createTokenBudget>;
