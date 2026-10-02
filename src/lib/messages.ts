/** Rotating, never-repeat-twice message pools personalized with the user's name. */

function rotator(pool: string[]) {
  let last = -1;
  return () => {
    if (pool.length === 1) return pool[0];
    let i = Math.floor(Math.random() * pool.length);
    while (i === last) i = Math.floor(Math.random() * pool.length);
    last = i;
    return pool[i];
  };
}

const reminderBodies = [
  (n: string) => `Hey ${n}, it's time to drink some water! Stay hydrated.`,
  (n: string) => `${n}, your body is asking for hydration. Take a quick water break.`,
  (n: string) => `Hey ${n}! A glass of water now will keep your energy flowing.`,
  (n: string) => `Psst, ${n} — your water glass misses you. Time for a refill!`,
  (n: string) => `${n}, stand up, stretch, and sip some water. You'll feel great.`,
  (n: string) => `Hydration check, ${n}! Have you had water recently?`,
];

const reminderFarBodies = [
  (n: string, remaining: string) => `Hey ${n}! You're only ${remaining} away from today's goal.`,
  (n: string, remaining: string) => `Almost there, ${n}! Just ${remaining} left. Keep going.`,
  (n: string, remaining: string) => `${n}, ${remaining} to go — you can absolutely do this.`,
];

const reminderIdleBodies = [
  (n: string) => `${n}, you haven't had water in a while. Time for a glass!`,
  (n: string) => `Hey ${n}, it's been a while since your last sip. Hydrate!`,
];

const motivationalByBucket: Record<string, ((n: string) => string)[]> = {
  b0: [
    (n) => `Let's get started, ${n}! Your first glass is waiting.`,
    (n) => `A fresh day, ${n}. Time to raise that glass!`,
    (n) => `${n}, every river starts with a single drop.`,
  ],
  b20: [
    (n) => `Good start, ${n}! Keep sipping.`,
    (n) => `You're on your way, ${n}. Nice pace!`,
    (n) => `Momentum building, ${n}. Another glass soon?`,
  ],
  b40: [
    (n) => `You're making great progress, ${n}!`,
    (n) => `Halfway energy loading, ${n}. Keep it flowing!`,
    (n) => `Nice rhythm, ${n}! Your body says thanks.`,
  ],
  b60: [
    (n) => `You're doing great, ${n}! Keep going.`,
    (n) => `Strong hydration game, ${n}. Impressive!`,
    (n) => `Over the hump, ${n}! The finish line is close.`,
  ],
  b80: [
    (n) => `Almost there, ${n}! One more push.`,
    (n) => `So close, ${n}! A few sips separate you from victory.`,
    (n) => `${n}, you're nearly a hydration hero today.`,
  ],
  b100: [
    (n) => `Goal complete! Amazing work, ${n}!`,
    (n) => `You did it, ${n}! Fully hydrated and thriving.`,
    (n) => `Champion level unlocked, ${n}. See you tomorrow!`,
  ],
};

const rotators = new Map<string, () => string>();

function getRotator(key: string, pool: ((n: string) => string)[], name: string) {
  const cacheKey = `${key}:${name}`;
  if (!rotators.has(cacheKey)) {
    rotators.set(cacheKey, rotator(pool.map((f) => f(name))));
  }
  return rotators.get(cacheKey)!();
}

export function nextReminderMessage(name: string, opts: { idleLong: boolean; remainingMl: number }): string {
  const { idleLong, remainingMl } = opts;
  if (remainingMl > 0 && remainingMl <= 800) {
    const pool = reminderFarBodies;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return pick(name, formatRemaining(remainingMl));
  }
  if (idleLong) {
    const pick = reminderIdleBodies[Math.floor(Math.random() * reminderIdleBodies.length)];
    return pick(name);
  }
  return getRotator("rem", reminderBodies, name);
}

export function sampleReminderMessages(name: string): string[] {
  return [0, 1, 2].map((i) => reminderBodies[(i * 2) % reminderBodies.length](name));
}

export function motivationalMessage(name: string, percent: number): string {
  const key =
    percent >= 100 ? "b100" : percent >= 80 ? "b80" : percent >= 60 ? "b60" : percent >= 40 ? "b40" : percent >= 20 ? "b20" : "b0";
  return getRotator(key, motivationalByBucket[key], name);
}

export function goalCompleteMessage(name: string): string {
  return getRotator("b100", motivationalByBucket.b100, name);
}

function formatRemaining(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${Math.round(ml)} ml`;
}
