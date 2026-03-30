import { describe, it, expect, beforeEach } from 'vitest';
import { initLogger, resetLogger } from '../../../../src/shared/logger/index.js';
import { createPipeline } from '../../../../src/services/conversation/pipeline.js';

beforeEach(() => {
  resetLogger();
  initLogger({ level: 'silent', isDevelopment: false });
});

describe('Conversation Pipeline', () => {
  it('rejects off-topic messages without AI cost', async () => {
    const log = initLogger({ level: 'silent', isDevelopment: false });
    const pipeline = createPipeline({
      filterExtractor: null,
      openAi: null,
      reasoningEngine: null,
      searchService: null,
      tokenBudget: null,
      log,
    });

    const result = await pipeline.process({
      message: 'Write me a python script to parse JSON files',
      history: [],
    });

    expect(result.isOffTopic).toBe(true);
    expect(result.response).toContain('boat');
    expect(result.timing.topicGuard).toBeGreaterThanOrEqual(0);
    expect(result.filters).toBeNull();
    expect(result.boatsReferenced).toEqual([]);
  });

  it('allows nautical messages through', async () => {
    const log = initLogger({ level: 'silent', isDevelopment: false });
    const pipeline = createPipeline({
      filterExtractor: null,
      openAi: null,
      reasoningEngine: null,
      searchService: null,
      tokenBudget: null,
      log,
    });

    const result = await pipeline.process({
      message: 'I want a sailboat under 50k euros around 38 feet in Greece',
      history: [],
    });

    expect(result.isOffTopic).toBe(false);
    // Without AI services, should still provide a basic response
    expect(result.response.length).toBeGreaterThan(0);
    expect(result.timing.total).toBeGreaterThanOrEqual(0);
  });

  it('provides fallback when budget is exhausted', async () => {
    const log = initLogger({ level: 'silent', isDevelopment: false });
    const mockBudget = {
      canSpend: () => ({ allowed: false, reason: 'Daily budget exhausted' }),
      record: () => 0,
      getStats: () => ({
        dailySpendUsd: 10,
        monthlySpendUsd: 50,
        totalRecords: 100,
        limits: { dailyLimitUsd: 10, monthlyLimitUsd: 200 },
      }),
      reset: () => {},
    };

    const pipeline = createPipeline({
      filterExtractor: null,
      openAi: null,
      reasoningEngine: null,
      searchService: null,
      tokenBudget: mockBudget,
      log,
    });

    const result = await pipeline.process({
      message: 'Show me sailboats',
      history: [],
    });

    expect(result.isOffTopic).toBe(false);
    expect(result.response).toContain('unavailable');
  });

  it('returns timing breakdown for all steps', async () => {
    const log = initLogger({ level: 'silent', isDevelopment: false });
    const pipeline = createPipeline({
      filterExtractor: null,
      openAi: null,
      reasoningEngine: null,
      searchService: null,
      tokenBudget: null,
      log,
    });

    const result = await pipeline.process({
      message: 'Find me a catamaran',
      history: [],
    });

    expect(result.timing).toHaveProperty('total');
    expect(result.timing).toHaveProperty('topicGuard');
    expect(result.timing).toHaveProperty('filterExtraction');
    expect(result.timing).toHaveProperty('embedding');
    expect(result.timing).toHaveProperty('search');
    expect(result.timing).toHaveProperty('reasoning');
  });
});
