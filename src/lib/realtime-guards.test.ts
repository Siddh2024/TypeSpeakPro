import { describe, expect, it } from 'vitest';
import { createMutationLock } from './mutation-locks';
import { isFreshRealtimeEvent, pruneStaleByHeartbeat, upsertById } from './realtime-guards';

describe('synchronization guards', () => {
    it('deduplicates a mutation while its lock window is active', () => {
        const lock = createMutationLock();

        const first = lock.acquire('leaderboard:save');
        const second = lock.acquire('leaderboard:save');

        expect(first.acquired).toBe(true);
        expect(second.acquired).toBe(false);
        expect(second.idempotencyKey).toBe(first.idempotencyKey);

        first.release();
        expect(lock.acquire('leaderboard:save').acquired).toBe(true);
    });

    it('rejects stale realtime events per logical stream', () => {
        const seen = new Map<string, number>();

        expect(isFreshRealtimeEvent(seen, 'player:1', 100)).toBe(true);
        expect(isFreshRealtimeEvent(seen, 'player:1', 99)).toBe(false);
        expect(isFreshRealtimeEvent(seen, 'player:1', 101)).toBe(true);
    });

    it('deduplicates participants and prunes abandoned ones', () => {
        const players = upsertById(
            [{ id: 'a', name: 'Old', lastSeenAt: 1 }],
            { id: 'a', name: 'Fresh', lastSeenAt: 20 },
        );

        expect(players).toEqual([{ id: 'a', name: 'Fresh', lastSeenAt: 20 }]);
        expect(pruneStaleByHeartbeat(players, 60000, 30000)).toEqual([]);
    });
});

