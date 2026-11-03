import { daysSince, formatDuration, formatPeriod, formatYearMonth, monthsInclusive, parseYearMonth } from '@core/time/time';

import { GeoPoint, haversineKm, projectToBox } from '../geo/geo';
import { Education, Experience, Profile } from '../profile/profile.model';

/* Tout ce qui se calcule à partir du parcours : durées, carte, frise de formation. */

export interface TimelineItem {
  readonly exp: Experience;
  readonly period: string;
  readonly months: number;
  readonly duration: string;
  /** Durée relative à l'expérience la plus longue, de 0 à 1. */
  readonly barWidth: number;
  readonly current: boolean;
  readonly secretId: string;
  readonly secretText: string;
}

export function timeline(profile: Profile, today: Date): TimelineItem[] {
  const months = profile.experiences.map((e) => monthsInclusive(e.start, e.end, today));
  const longest = Math.max(...months);
  return profile.experiences.map((exp, i) => ({
    exp,
    period: formatPeriod(exp.start, exp.end),
    months: months[i],
    duration: formatDuration(months[i]),
    barWidth: months[i] / longest,
    current: exp.end === null,
    secretId: `exp-${exp.id}`,
    secretText: exp.secret.replace('{jours}', String(daysSince(exp.start, today))),
  }));
}

export interface CareerTotals {
  readonly months: readonly number[];
  readonly totalMonths: number;
  /** « 12 + 2 + 2 = 16 mois ». */
  readonly breakdown: string;
  /** « 2024 → aujourd'hui ». */
  readonly span: string;
  readonly cityCount: number;
  readonly region: string;
}

export function careerTotals(profile: Profile, today: Date): CareerTotals {
  const experiences = profile.experiences;
  const months = experiences.map((e) => monthsInclusive(e.start, e.end, today));
  const totalMonths = months.reduce((sum, m) => sum + m, 0);
  const chronological = byStart(experiences);
  const oldest = chronological[0];
  const latest = chronological[chronological.length - 1];
  return {
    months,
    totalMonths,
    breakdown: `${months.join(' + ')} = ${totalMonths} mois`,
    span: `${oldest.start.slice(0, 4)} → ${latest.end ? formatYearMonth(latest.end) : "aujourd'hui"}`,
    cityCount: new Set(experiences.map((e) => e.place.city)).size,
    region: oldest.place.region,
  };
}

export interface MapPoint {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly landmark: boolean;
  readonly anchor: 'start' | 'end';
  readonly dy: number;
}

export interface MapLeg {
  readonly key: string;
  readonly km: number;
  readonly label: string;
}

export interface CareerMap {
  readonly points: readonly MapPoint[];
  /** Points de la polyligne, du plus ancien au plus récent. */
  readonly path: string;
  readonly legs: readonly MapLeg[];
  readonly totalKm: number;
}

export interface Landmark {
  readonly id: string;
  readonly label: string;
  readonly geo: GeoPoint;
}

/** Carte du parcours dans une boîte `box`, avec un repère géographique en pointillé. */
export function careerMap(profile: Profile, box: { w: number; h: number }, landmark: Landmark): CareerMap {
  const chronological = byStart(profile.experiences);
  const projected = projectToBox([...chronological.map((e) => e.place.geo), landmark.geo], box, 38);
  const points: MapPoint[] = chronological.map((e, i) => ({
    id: e.id,
    label: e.place.city,
    x: projected[i].x,
    y: projected[i].y,
    landmark: false,
    anchor: projected[i].x > box.w / 2 ? 'end' : 'start',
    dy: i % 2 ? 16 : -9,
  }));
  const mark = projected[projected.length - 1];
  points.push({ id: landmark.id, label: landmark.label, x: mark.x, y: mark.y, landmark: true, anchor: 'start', dy: 4 });

  const legs = chronological.slice(1).map((e, i) => {
    const from = chronological[i];
    const km = Math.round(haversineKm(from.place.geo, e.place.geo));
    return { key: `${from.id}-${e.id}`, km, label: `${from.place.city} → ${e.place.city} · ${km} km` };
  });
  return {
    points,
    path: points
      .filter((p) => !p.landmark)
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' '),
    legs,
    totalKm: legs.reduce((sum, leg) => sum + leg.km, 0),
  };
}

export interface RulerBar {
  readonly id: string;
  readonly label: string;
  /** Début et largeur, en fraction de la frise (0 à 1). */
  readonly start: number;
  readonly width: number;
}

export interface EducationRuler {
  readonly years: readonly { readonly year: number; readonly at: number }[];
  readonly bars: readonly RulerBar[];
}

/** Frise des formations : une graduation par année, une barre par diplôme. */
export function educationRuler(education: readonly Education[]): EducationRuler {
  const toMonths = (value: string, end: boolean) => {
    const { year, month } = parseYearMonth(value);
    // Une année seule est une année scolaire : rentrée en septembre, fin en juin.
    const m = /^\d{4}$/.test(value) ? (end ? 6 : 9) : month;
    return year * 12 + m - 1;
  };
  const starts = education.map((e) => toMonths(e.start, false));
  const ends = education.map((e) => toMonths(e.end, true) + 1);
  const first = Math.floor(Math.min(...starts) / 12) * 12;
  const last = Math.ceil(Math.max(...ends) / 12) * 12;
  const span = last - first;
  const years = [];
  for (let m = first; m <= last; m += 12) years.push({ year: m / 12, at: (m - first) / span });
  return {
    years,
    bars: education
      .map((e, i) => ({
        id: e.id,
        label: e.acronym ?? (e.degree.startsWith('Bac') ? 'BAC' : e.degree.split(' ')[0]),
        start: (starts[i] - first) / span,
        width: (ends[i] - starts[i]) / span,
      }))
      .sort((a, b) => a.start - b.start),
  };
}

/** « CPI = Coordinateur de projets informatiques », pour chaque sigle. */
export function acronymDecoder(profile: Profile): string {
  return [
    ...profile.education.filter((e) => e.acronym).map((e) => `${e.acronym} = ${e.degree.replace(/^\S+\s/, '')}`),
    ...profile.certifications.map((c) => `${c.label} = ${c.description}`),
  ].join('\n');
}

/** « sept. 2020 → août 2026 · 6 ans de formation en ligne droite ». */
export function educationSpan(education: readonly Education[], today: Date): string {
  const first = education.map((e) => e.start).sort()[0];
  const last = education.map((e) => e.end).sort().at(-1) ?? first;
  const years = Math.round(monthsInclusive(first, last, today) / 12);
  return `${formatYearMonth(first)} → ${formatYearMonth(last)} · ${years} ans de formation en ligne droite`;
}

function byStart(experiences: readonly Experience[]): Experience[] {
  return [...experiences].sort((a, b) => a.start.localeCompare(b.start));
}
