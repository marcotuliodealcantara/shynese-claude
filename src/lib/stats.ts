import type { Character } from './storage';

// All "days" are local calendar days (the user's time zone).

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date): string {
  const d = startOfDay(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Start of the "last 7 days" window: today plus the 6 days before it.
function startOfLast7Days(now: Date): Date {
  return addDays(startOfDay(now), -6);
}

export interface Streaks {
  current: number; // consecutive days with a session, ending today (or yesterday, if not studied yet today)
  longest: number;
}

export function computeStreaks(sessionDates: Date[], now: Date = new Date()): Streaks {
  const days = new Set(sessionDates.map(dayKey));
  if (days.size === 0) return { current: 0, longest: 0 };

  // Current: walk back from today; a missing "today" doesn't break the streak yet.
  let cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  let current = 0;
  while (days.has(dayKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Longest: scan the sorted distinct days for the longest consecutive run.
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const next = new Date(`${sorted[i]}T00:00:00`);
    // Round to absorb DST shifts (23h/25h days)
    run = Math.round((next.getTime() - prev.getTime()) / DAY_MS) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return { current, longest: Math.max(longest, current) };
}

export function countSessionsLast7Days(sessionDates: Date[], now: Date = new Date()): number {
  const from = startOfLast7Days(now).getTime();
  return sessionDates.filter((date) => date.getTime() >= from).length;
}

// Words reviewed in the last 7 days that had already been seen before
// (answered at least twice in total, so this isn't their first appearance).
export function countReviewedLast7Days(characters: Character[], now: Date = new Date()): number {
  const from = startOfLast7Days(now).getTime();
  return characters.filter((c) => c.attempts >= 2 && c.lastReviewed.getTime() >= from).length;
}

// True when the newest word was added within the last `days` days. The vocabulary-growth chart
// is only shown in that case — with no recent additions it would just be a flat line.
export function hasRecentNewWords(characters: Character[], days = 30, now: Date = new Date()): boolean {
  const from = now.getTime() - days * DAY_MS;
  return characters.some((c) => c.createdAt.getTime() >= from);
}

export interface GrowthPoint {
  date: string; // YYYY-MM-DD (day, or first day of the week)
  total: number; // vocabulary size at the end of that period
}

// Cumulative vocabulary size over time, from the first word added until today.
// Daily points for spans up to ~6 months, weekly points beyond that (keeps the chart readable).
export function buildVocabularyGrowth(characters: Character[], now: Date = new Date()): GrowthPoint[] {
  if (characters.length === 0) return [];

  const addedPerDay = new Map<string, number>();
  let first = startOfDay(now);
  for (const c of characters) {
    const key = dayKey(c.createdAt);
    addedPerDay.set(key, (addedPerDay.get(key) ?? 0) + 1);
    if (c.createdAt < first) first = startOfDay(c.createdAt);
  }

  const today = startOfDay(now);
  const spanDays = Math.round((today.getTime() - first.getTime()) / DAY_MS);
  const step = spanDays > 180 ? 7 : 1;

  const points: GrowthPoint[] = [];
  let total = 0;
  let periodStart = first;
  let day = first;
  while (day <= today) {
    total += addedPerDay.get(dayKey(day)) ?? 0;
    const next = addDays(day, 1);
    const periodEnds = Math.round((next.getTime() - periodStart.getTime()) / DAY_MS) >= step || next > today;
    if (periodEnds) {
      points.push({ date: dayKey(periodStart), total });
      periodStart = next;
    }
    day = next;
  }
  return points;
}
