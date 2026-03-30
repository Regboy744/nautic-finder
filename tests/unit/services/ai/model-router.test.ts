import { describe, it, expect } from 'vitest';
import { routeTask, getRoutingTable } from '../../../../src/services/ai/model-router.js';

describe('Model Router', () => {
  describe('routeTask', () => {
    it('routes filter-extraction to gemini', () => {
      expect(routeTask('filter-extraction')).toBe('gemini');
    });

    it('routes topic-guard to gemini', () => {
      expect(routeTask('topic-guard')).toBe('gemini');
    });

    it('routes embedding to openai', () => {
      expect(routeTask('embedding')).toBe('openai');
    });

    it('routes reasoning to claude', () => {
      expect(routeTask('reasoning')).toBe('claude');
    });

    it('routes comparison to claude', () => {
      expect(routeTask('comparison')).toBe('claude');
    });

    it('routes image-analysis to gemini', () => {
      expect(routeTask('image-analysis')).toBe('gemini');
    });
  });

  describe('getRoutingTable', () => {
    it('returns all task routings', () => {
      const table = getRoutingTable();
      expect(Object.keys(table)).toHaveLength(6);
      expect(table['filter-extraction']).toBe('gemini');
      expect(table['reasoning']).toBe('claude');
    });

    it('returns a copy (not the original)', () => {
      const table1 = getRoutingTable();
      const table2 = getRoutingTable();
      expect(table1).toEqual(table2);
      expect(table1).not.toBe(table2);
    });
  });
});
