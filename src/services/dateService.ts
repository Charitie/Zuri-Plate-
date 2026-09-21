import { addDays, format, parseISO } from 'date-fns';

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

export function nowTimestamp(): string {
  return new Date().toISOString();
}
