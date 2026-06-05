const isDev = import.meta.env.DEV;

const lastSeen = new Map<string, number>();

export const warnRepeatedDev = (key: string, message: string, windowMs = 1000) => {
  if (!isDev) return;

  const now = Date.now();
  const previous = lastSeen.get(key) ?? 0;
  if (now - previous < windowMs) {
    console.warn(message);
  }
  lastSeen.set(key, now);
};

export const timeOperationDev = <T>(key: string, thresholdMs: number, operation: () => T): T => {
  if (!isDev) return operation();

  const start = performance.now();
  const result = operation();
  const duration = performance.now() - start;
  if (duration > thresholdMs) {
    console.warn(`[perf] ${key} took ${Math.round(duration)}ms`);
  }
  return result;
};
