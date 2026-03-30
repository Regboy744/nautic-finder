import { describe, it, expect } from 'vitest';
import { checkTopic, getOffTopicResponse } from '../../../../src/services/ai/topic-guard.js';

describe('Topic Guard', () => {
  describe('checkTopic', () => {
    it('detects nautical queries as on-topic', () => {
      const result = checkTopic('I want a sailboat under 50k euros in Greece');
      expect(result.isOnTopic).toBe(true);
      expect(result.confidence).toBe('certain');
    });

    it('detects boat-related queries with manufacturer names', () => {
      const result = checkTopic('Show me Bavaria 38 listings');
      expect(result.isOnTopic).toBe(true);
    });

    it('detects queries about boat specs', () => {
      const result = checkTopic('What is a good displacement length ratio?');
      expect(result.isOnTopic).toBe(true);
    });

    it('rejects cryptocurrency topics', () => {
      const result = checkTopic('What is the best bitcoin investment strategy?');
      expect(result.isOnTopic).toBe(false);
      expect(result.confidence).toBe('certain');
    });

    it('rejects cooking topics', () => {
      const result = checkTopic('How do I bake a chocolate cake with these ingredients?');
      expect(result.isOnTopic).toBe(false);
    });

    it('rejects coding topics', () => {
      const result = checkTopic('Write me a python script to parse JSON');
      expect(result.isOnTopic).toBe(false);
    });

    it('rejects political topics', () => {
      const result = checkTopic('Who will win the next presidential election?');
      expect(result.isOnTopic).toBe(false);
    });

    it('allows short greetings through as ambiguous', () => {
      const result = checkTopic('Hello!');
      expect(result.isOnTopic).toBe(true);
      expect(result.confidence).toBe('ambiguous');
    });

    it('allows single nautical keyword', () => {
      const result = checkTopic('Tell me about this yacht');
      expect(result.isOnTopic).toBe(true);
    });

    it('rejects longer off-topic messages without nautical keywords', () => {
      const result = checkTopic(
        'Can you help me plan my vacation itinerary for Japan next summer?',
      );
      expect(result.isOnTopic).toBe(false);
      expect(result.confidence).toBe('likely');
    });
  });

  describe('getOffTopicResponse', () => {
    it('returns a helpful redirect message', () => {
      const response = getOffTopicResponse();
      expect(response).toContain('boat');
      expect(response).toContain('NauticFinder');
    });
  });
});
