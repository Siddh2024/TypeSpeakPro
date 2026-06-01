type LockResult = {
    acquired: boolean;
    idempotencyKey: string;
    release: () => void;
};

export type MutationLock = {
    acquire: (scope: string, windowMs?: number) => LockResult;
    isLocked: (scope: string) => boolean;
    clear: (scope?: string) => void;
};

const createKey = (scope: string) => `${scope}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

export const createMutationLock = (): MutationLock => {
    const locks = new Map<string, { key: string; startedAt: number }>();

    return {
        acquire(scope, windowMs = 1500) {
            const now = Date.now();
            const existing = locks.get(scope);

            if (existing && now - existing.startedAt < windowMs) {
                return {
                    acquired: false,
                    idempotencyKey: existing.key,
                    release: () => undefined,
                };
            }

            const key = createKey(scope);
            locks.set(scope, { key, startedAt: now });

            return {
                acquired: true,
                idempotencyKey: key,
                release: () => {
                    const current = locks.get(scope);
                    if (current?.key === key) {
                        locks.delete(scope);
                    }
                },
            };
        },
        isLocked(scope) {
            return locks.has(scope);
        },
        clear(scope) {
            if (scope) {
                locks.delete(scope);
                return;
            }
            locks.clear();
        },
    };
};

