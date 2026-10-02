import { addDays, format, parseISO, startOfDay } from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';

export function todayIso(): string {
  return format(new Date(), DATE_FORMAT);
}

export function isoDate(date: Date): string {
  return format(date, DATE_FORMAT);
}

export function addDaysIso(dateIso: string, days: number): string {
  return format(addDays(parseISO(dateIso), days), DATE_FORMAT);
}

export function dateRange(startIso: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDaysIso(startIso, i));
}

/** e.g. "Tuesday, September 22" — for screen-reader labels and headings. */
export function formatLongDate(dateIso: string): string {
  return format(parseISO(dateIso), 'EEEE, MMMM d');
}

export function msUntilNextDay(now: Date = new Date()): number {
  return addDays(startOfDay(now), 1).getTime() - now.getTime();
}

export function nowTimestamp(): string {
  return new Date().toISOString();
}
