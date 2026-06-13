import { describe, expect, it } from 'vitest';
import {
  aggregatePracticeRecords,
  aggregateTypingRecords,
  calculateAccuracy,
  calculatePercent,
  calculateWpm,
  chooseBestTypingRecord,
  dedupeMetricRecords,
  rankBestTypingRecords,
  sanitizeMetricRecord,
} from './analytics';

describe('analytics metrics', () => {
  it('calculates typing metrics deterministically', () => {
    expect(calculateWpm(250, 60)).toBe(50);
    expect(calculateWpm(250, 0)).toBe(0);
    expect(calculateAccuracy('abcx', 'abcd')).toBe(75);
    expect(calculateAccuracy('', 'abcd')).toBe(100);
    expect(calculatePercent(3, 4)).toBe(75);
  });

  it('rejects impossible derived metrics', () => {
    expect(sanitizeMetricRecord({ wpm: -1 })).toBeNull();
    expect(sanitizeMetricRecord({ wpm: 401 })).toBeNull();
    expect(sanitizeMetricRecord({ accuracy: 120 })).toBeNull();
    expect(sanitizeMetricRecord({ score: -5 })).toBeNull();
    expect(sanitizeMetricRecord({ time_duration: -1 })).toBeNull();
  });
});

describe('analytics dedupe and aggregation', () => {
  const rows = [
    { id: 'a', user_id: 'u1', wpm: 80, accuracy: 90, time_duration: 60, created_at: '2026-01-01T00:00:00Z' },
    { id: 'a', user_id: 'u1', wpm: 80, accuracy: 90, time_duration: 60, created_at: '2026-01-01T00:00:00Z' },
    { id: 'b', user_id: 'u1', wpm: 85, accuracy: 88, time_duration: 30, created_at: '2026-01-02T00:00:00Z' },
    { id: 'c', user_id: 'u2', wpm: 85, accuracy: 95, time_duration: 30, created_at: '2026-01-02T00:00:00Z' },
  ];

  it('deduplicates sessions before aggregating dashboard stats', () => {
    const aggregate = aggregateTypingRecords(rows);

    expect(dedupeMetricRecords(rows)).toHaveLength(3);
    expect(aggregate.totalTests).toBe(3);
    expect(aggregate.avgWpm).toBe(83);
    expect(aggregate.totalTimeSeconds).toBe(120);
  });

  it('chooses personal best deterministically', () => {
    expect(chooseBestTypingRecord(rows)?.id).toBe('c');
  });

  it('uses the same ranked inputs for dashboard and leaderboard', () => {
    const ranked = rankBestTypingRecords(rows);

    expect(ranked.map((row) => row.user_id)).toEqual(['u2', 'u1']);
    expect(ranked[0].accuracy).toBe(95);
  });

  it('aggregates practice records after dedupe and validation', () => {
    const aggregate = aggregatePracticeRecords([
      { id: 'l1', practice_type: 'listening', score: 20, accuracy: 50 },
      { id: 'l1', practice_type: 'listening', score: 20, accuracy: 50 },
      { id: 'v1', practice_type: 'verbal', score: 30, accuracy: 75 },
      { id: 'bad', practice_type: 'verbal', score: -1, accuracy: 75 },
    ]);

    expect(aggregate.voicePoints).toBe(20);
    expect(aggregate.voiceAccuracy).toBe(50);
    expect(aggregate.verbalPoints).toBe(30);
    expect(aggregate.verbalAccuracy).toBe(75);
  });
});
