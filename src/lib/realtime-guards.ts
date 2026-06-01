export type RealtimeMeta = {
    eventId: string;
    eventTs: number;
    sequence?: number;
};

export type VersionedRealtimePayload<T> = T & {
    meta?: RealtimeMeta;
};

export const createRealtimeMeta = (sequence?: number): RealtimeMeta => ({
    eventId: `${Date.now()}:${Math.random().toString(36).slice(2, 10)}`,
    eventTs: Date.now(),
    sequence,
});

export const isFreshRealtimeEvent = (
    lastSeen: Map<string, number>,
    key: string,
    eventTs: number | undefined,
) => {
    const ts = eventTs ?? Date.now();
    const previous = lastSeen.get(key) ?? 0;
    if (ts < previous) return false;
    lastSeen.set(key, ts);
    return true;
};

export const upsertById = <T extends { id: string }>(items: T[], item: T) => {
    const index = items.findIndex(existing => existing.id === item.id);
    if (index === -1) return [...items, item];

    const next = [...items];
    next[index] = { ...next[index], ...item };
    return next;
};

export const pruneStaleByHeartbeat = <T extends { lastSeenAt?: number }>(
    items: T[],
    now = Date.now(),
    maxAgeMs = 30000,
) => items.filter(item => !item.lastSeenAt || now - item.lastSeenAt <= maxAgeMs);

