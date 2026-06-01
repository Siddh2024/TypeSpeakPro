/**
 * Adaptive Coach — pure analysis logic, no external API calls.
 * Reads char-level error data and produces personalized recommendations.
 */

export interface CharErrors {
  [char: string]: number; // e.g. { "s": 5, "p": 3, "th": 2 }
}

export interface CoachInsights {
  weakKeys: string[];          // top 5 most-errored chars
  slowKeys: string[];          // top 3 keys with highest avg delay (hesitation)
  recommendedDifficulty: 'easy' | 'medium' | 'hard';
  focusDrill: string;          // generated drill text
  tip: string;                 // one-line coaching tip
  accuracyTrend: 'improving' | 'declining' | 'stable';
  speedTrend: 'improving' | 'declining' | 'stable';
}

/** Merge multiple CharErrors objects from recent sessions */
export function mergeCharErrors(sessions: CharErrors[]): CharErrors {
  const merged: CharErrors = {};
  for (const session of sessions) {
    for (const [char, count] of Object.entries(session)) {
      merged[char] = (merged[char] || 0) + count;
    }
  }
  return merged;
}

/** Return top N most-errored characters */
export function getWeakKeys(errors: CharErrors, topN = 5): string[] {
  return Object.entries(errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([char]) => char);
}

/**
 * Generate a focused drill string that forces the user to practice weak keys.
 * Builds ~80 chars of text heavily featuring those characters.
 */
export function generateFocusDrill(weakKeys: string[]): string {
  if (weakKeys.length === 0) {
    return 'the quick brown fox jumps over the lazy dog';
  }

  // Word bank keyed by character — words that prominently feature that char
  const wordBank: Record<string, string[]> = {
    a: ['apple', 'area', 'alarm', 'atlas', 'alpha', 'apart', 'again'],
    b: ['bubble', 'brave', 'blend', 'bring', 'below', 'basic', 'build'],
    c: ['catch', 'clock', 'crisp', 'cycle', 'craft', 'check', 'coast'],
    d: ['drive', 'depth', 'draft', 'dance', 'dread', 'dodge', 'daily'],
    e: ['every', 'event', 'enter', 'elect', 'eager', 'eight', 'equal'],
    f: ['fresh', 'frame', 'front', 'field', 'force', 'floor', 'fault'],
    g: ['great', 'group', 'grace', 'grind', 'globe', 'grant', 'guide'],
    h: ['heavy', 'heart', 'harsh', 'habit', 'honor', 'house', 'human'],
    i: ['image', 'ideal', 'input', 'inner', 'issue', 'index', 'irony'],
    j: ['judge', 'joint', 'jumpy', 'jewel', 'joust', 'jelly', 'jazzy'],
    k: ['knack', 'knife', 'knock', 'kneel', 'kayak', 'kiosk', 'kinky'],
    l: ['level', 'light', 'limit', 'local', 'logic', 'loyal', 'lunar'],
    m: ['match', 'merge', 'model', 'moral', 'mount', 'music', 'magic'],
    n: ['night', 'nerve', 'noble', 'north', 'novel', 'nurse', 'naive'],
    o: ['ocean', 'offer', 'often', 'order', 'other', 'outer', 'owner'],
    p: ['place', 'plain', 'plant', 'point', 'power', 'press', 'price'],
    q: ['quest', 'quick', 'quiet', 'quota', 'queen', 'quirk', 'quill'],
    r: ['range', 'reach', 'ready', 'realm', 'right', 'river', 'round'],
    s: ['space', 'speed', 'stage', 'start', 'state', 'still', 'store'],
    t: ['table', 'taste', 'teach', 'think', 'those', 'three', 'track'],
    u: ['under', 'union', 'until', 'upper', 'urban', 'usage', 'ultra'],
    v: ['value', 'valid', 'vault', 'verse', 'video', 'vigor', 'vivid'],
    w: ['watch', 'water', 'where', 'while', 'whole', 'world', 'write'],
    x: ['exact', 'exist', 'extra', 'excel', 'exert', 'expel', 'oxide'],
    y: ['yacht', 'yield', 'young', 'yours', 'yummy', 'yearn', 'yodel'],
    z: ['zebra', 'zonal', 'zesty', 'zilch', 'zippy', 'zones', 'zoned'],
    th: ['think', 'those', 'three', 'throw', 'thick', 'thrive', 'theme'],
    sh: ['shape', 'share', 'sharp', 'shift', 'shine', 'shore', 'shout'],
    ch: ['chain', 'chair', 'chase', 'check', 'chest', 'chief', 'child'],
    qu: ['quest', 'quick', 'quiet', 'quota', 'queen', 'quirk', 'quill'],
  };

  const words: string[] = [];
  let charCount = 0;

  // Cycle through weak keys, picking words until we have ~80 chars
  let keyIndex = 0;
  while (charCount < 80) {
    const key = weakKeys[keyIndex % weakKeys.length];
    const pool = wordBank[key] || wordBank[key[0]] || ['the', 'and', 'for'];
    const word = pool[Math.floor(Math.random() * pool.length)];
    words.push(word);
    charCount += word.length + 1;
    keyIndex++;
  }

  return words.join(' ');
}

/** Return top N keys with highest average delay (hesitation keys) */
export function getSlowKeys(slowKeyMaps: Record<string, number>[], topN = 3): string[] {
  const merged: Record<string, number[]> = {};
  for (const map of slowKeyMaps) {
    for (const [key, avgMs] of Object.entries(map)) {
      if (!merged[key]) merged[key] = [];
      merged[key].push(avgMs);
    }
  }
  return Object.entries(merged)
    .map(([key, vals]) => ({ key, avg: vals.reduce((a, b) => a + b, 0) / vals.length }))
    .filter(e => e.avg > 300) // only flag keys where avg delay > 300ms
    .sort((a, b) => b.avg - a.avg)
    .slice(0, topN)
    .map(e => e.key);
}

/** Determine recommended difficulty from recent WPM and accuracy */
export function recommendDifficulty(
  recentWpms: number[],
  recentAccuracies: number[]
): 'easy' | 'medium' | 'hard' {
  if (recentWpms.length === 0) return 'medium';

  const avgWpm = recentWpms.reduce((a, b) => a + b, 0) / recentWpms.length;
  const avgAcc = recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;

  if (avgAcc < 85 || avgWpm < 30) return 'easy';
  if (avgWpm >= 70 && avgAcc >= 95) return 'hard';
  return 'medium';
}

/** Detect trend from a series of numbers */
function detectTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable';
  const first = values.slice(0, Math.ceil(values.length / 2));
  const second = values.slice(Math.floor(values.length / 2));
  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
  const delta = avgSecond - avgFirst;
  if (delta > 3) return 'improving';
  if (delta < -3) return 'declining';
  return 'stable';
}

/** Build a one-line coaching tip based on weak keys, slow keys, and trends */
function buildTip(
  weakKeys: string[],
  slowKeys: string[],
  accuracyTrend: string,
  speedTrend: string,
  avgAccuracy: number
): string {
  if (avgAccuracy < 85) {
    return `Slow down and focus on accuracy first — speed will follow naturally.`;
  }
  if (weakKeys.length > 0) {
    const keys = weakKeys.slice(0, 3).map(k => `"${k}"`).join(', ');
    return `You frequently mistype ${keys}. The drill below targets those keys.`;
  }
  if (slowKeys.length > 0) {
    const keys = slowKeys.slice(0, 2).map(k => `"${k}"`).join(' and ');
    return `You hesitate on ${keys}. Practice them slowly until muscle memory kicks in.`;
  }
  if (speedTrend === 'improving') {
    return `Great progress on speed! Keep pushing — consistency is key.`;
  }
  if (speedTrend === 'declining') {
    return `Your speed has dipped recently. Try shorter, focused sessions.`;
  }
  return `You are performing consistently. Challenge yourself with harder difficulty.`;
}

/** Main entry point — takes raw session data and returns full insights */
export function analyzePerformance(sessions: {
  wpm: number;
  accuracy: number;
  charErrors: CharErrors;
  slowKeys?: Record<string, number>;
}[]): CoachInsights {
  if (sessions.length === 0) {
    return {
      weakKeys: [],
      slowKeys: [],
      recommendedDifficulty: 'medium',
      focusDrill: 'the quick brown fox jumps over the lazy dog',
      tip: 'Complete a typing test to get personalized coaching.',
      accuracyTrend: 'stable',
      speedTrend: 'stable',
    };
  }

  const merged = mergeCharErrors(sessions.map(s => s.charErrors));
  const weakKeys = getWeakKeys(merged, 5);
  const slowKeys = getSlowKeys(sessions.map(s => s.slowKeys ?? {}), 3);
  const wpms = sessions.map(s => s.wpm);
  const accs = sessions.map(s => s.accuracy);
  const recommendedDifficulty = recommendDifficulty(wpms, accs);
  // Combine weak + slow keys for the drill (deduplicated)
  const drillKeys = [...new Set([...weakKeys, ...slowKeys])];
  const focusDrill = generateFocusDrill(drillKeys.length > 0 ? drillKeys : weakKeys);
  const accuracyTrend = detectTrend(accs);
  const speedTrend = detectTrend(wpms);
  const avgAccuracy = accs.reduce((a, b) => a + b, 0) / accs.length;
  const tip = buildTip(weakKeys, slowKeys, accuracyTrend, speedTrend, avgAccuracy);

  return {
    weakKeys,
    slowKeys,
    recommendedDifficulty,
    focusDrill,
    tip,
    accuracyTrend,
    speedTrend,
  };
}
