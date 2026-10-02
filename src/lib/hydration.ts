import type { WaterEntry } from "./types";

/** Local calendar day key: yyyy-mm-dd */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Build map of dayKey -> total ml */
export function totalsByDay(entries: WaterEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    const k = dayKey(new Date(e.createdAt));
    map.set(k, (map.get(k) ?? 0) + e.amountMl);
  }
  return map;
}

export function entriesForDay(entries: WaterEntry[], day: Date): WaterEntry[] {
  const k = dayKey(day);
  return entries
    .filter((e) => dayKey(new Date(e.createdAt)) === k)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function totalForDay(entries: WaterEntry[], day: Date): number {
  const k = dayKey(day);
  return entries.reduce((sum, e) => (dayKey(new Date(e.createdAt)) === k ? sum + e.amountMl : sum), 0);
}

export interface StreakInfo {
  current: number;
  longest: number;
  completedDays: number;
}

export function computeStreaks(entries: WaterEntry[], goalMl: number): StreakInfo {
  const totals = totalsByDay(entries);
  const today = startOfDay(new Date());

  let longest = 0;
  let run = 0;

  // Walk from the earliest recorded day to today to find the longest run.
  const keys = Array.from(totals.keys()).sort();
  let completedDays = 0;
  for (const k of keys) {
    if ((totals.get(k) ?? 0) >= goalMl) completedDays += 1;
  }
  if (keys.length > 0) {
    let cursor = new Date(keys[0] + "T00:00:00");
    const end = today;
    while (cursor <= end) {
      const k = dayKey(cursor);
      if ((totals.get(k) ?? 0) >= goalMl) {
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
      cursor = addDays(cursor, 1);
    }
  }

  // Current streak: consecutive completed days ending today (or yesterday if today not done yet).
  let current = 0;
  let cursor = today;
  if ((totals.get(dayKey(cursor)) ?? 0) < goalMl) {
    cursor = addDays(cursor, -1);
  }
  while ((totals.get(dayKey(cursor)) ?? 0) >= goalMl) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest, completedDays };
}

export interface DayDatum {
  key: string;
  date: Date;
  label: string; // Mon
  totalMl: number;
  goalMet: boolean;
}

export function lastNDays(entries: WaterEntry[], n: number, goalMl: number): DayDatum[] {
  const totals = totalsByDay(entries);
  const out: DayDatum[] = [];
  const today = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const k = dayKey(d);
    const total = totals.get(k) ?? 0;
    out.push({
      key: k,
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      totalMl: total,
      goalMet: total >= goalMl,
    });
  }
  return out;
}

export function formatMl(ml: number): string {
  if (ml >= 1000) {
    const l = ml / 1000;
    return `${Number.isInteger(l) ? l : l.toFixed(1)} L`;
  }
  return `${Math.round(ml)} ml`;
}

export function formatLiters(ml: number, digits = 1): string {
  return (ml / 1000).toFixed(digits);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

/** Parse "HH:MM" into a Date on the given day. */
export function timeOnDay(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = startOfDay(day);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/**
 * Compute the next reminder time using the user's settings and hydration state.
 * Smart logic: never within `snoozeMins` after a meaningful drink, never
 * outside active hours, never after the goal is completed today.
 */
export function computeNextReminder(opts: {
  now: Date;
  intervalMins: number;
  activeStart: string; // HH:MM
  activeEnd: string; // HH:MM
  lastDrinkAt: Date | null;
  lastNotifiedAt: Date | null;
  goalComplete: boolean;
}): Date | null {
  const { now, intervalMins, activeStart, activeEnd, lastDrinkAt, lastNotifiedAt, goalComplete } = opts;
  if (goalComplete) return null;

  const start = timeOnDay(now, activeStart);
  let end = timeOnDay(now, activeEnd);
  if (end <= start) end = addDays(end, 1); // overnight window

  const snoozeMins = Math.min(45, Math.max(20, Math.round(intervalMins * 0.6)));
  let next = new Date(now.getTime() + intervalMins * 60_000);

  if (lastNotifiedAt) {
    const fromNotify = new Date(lastNotifiedAt.getTime() + intervalMins * 60_000);
    if (fromNotify > next) next = fromNotify;
  }
  if (lastDrinkAt) {
    const fromDrink = new Date(lastDrinkAt.getTime() + snoozeMins * 60_000);
    if (fromDrink > next) next = fromDrink;
  }

  if (next < start) next = start;
  if (next > end) {
    // outside today's window -> next window start
    const tomorrowStart = timeOnDay(addDays(now, 1), activeStart);
    if (now >= start && now <= end) return tomorrowStart;
    if (now < start) return start;
    return tomorrowStart;
  }
  return next;
}
