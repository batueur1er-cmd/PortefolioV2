import { InjectionToken } from '@angular/core';

import { LANG } from '../i18n/lang';

/* Dates du parcours. Le profil les écrit « AAAA » ou « AAAA-MM ». */

/** Date du jour, injectable pour que les calculs restent testables. */
export const TODAY = new InjectionToken<Date>('TODAY', {
  providedIn: 'root',
  factory: () => new Date(),
});

export interface YearMonth {
  readonly year: number;
  /** De 1 à 12. */
  readonly month: number;
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FR_MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

const MONTHS = LANG === 'en' ? EN_MONTHS : FR_MONTHS;

export function parseYearMonth(value: string): YearMonth {
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
  if (!match) throw new Error(`Date invalide : « ${value} » (attendu AAAA ou AAAA-MM)`);
  return { year: Number(match[1]), month: match[2] ? Number(match[2]) : 1 };
}

export const toYearMonth = (date: Date): YearMonth => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
});

/** Mois couverts, bornes incluses : mars → avril compte 2 mois, comme sur LinkedIn. */
export function monthsInclusive(start: string, end: string | null, today: Date): number {
  const s = parseYearMonth(start);
  const e = end ? parseYearMonth(end) : toYearMonth(today);
  return Math.max(1, (e.year - s.year) * 12 + (e.month - s.month) + 1);
}

/** Jours écoulés depuis le premier jour du mois de départ. */
export function daysSince(start: string, today: Date): number {
  const s = parseYearMonth(start);
  const from = Date.UTC(s.year, s.month - 1, 1);
  const to = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

function durationEn(months: number): string {
  const unit = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
  if (months < 12) return unit(months, 'month');
  const rest = months % 12;
  const years = unit(Math.floor(months / 12), 'year');
  return rest ? `${years} and ${unit(rest, 'month')}` : years;
}

export function formatDuration(months: number): string {
  if (LANG === 'en') return durationEn(months);
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const label = `${years} an${years > 1 ? 's' : ''}`;
  return rest ? `${label} et ${rest} mois` : label;
}

export function formatYearMonth(value: string): string {
  if (/^\d{4}$/.test(value)) return value;
  const { year, month } = parseYearMonth(value);
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatPeriod(start: string, end: string | null): string {
  return `${formatYearMonth(start)} — ${end ? formatYearMonth(end) : LANG === 'en' ? 'present' : "aujourd'hui"}`;
}
