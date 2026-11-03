import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { haversineKm, projectToBox } from '../../core/geo';
import { PROFILE } from '../../core/profile.data';
import { Experience } from '../../core/profile.model';
import { TODAY, daysSince, formatDuration, formatPeriod, formatYearMonth, monthsInclusive } from '../../core/time';
import { PageContext } from '../page-context';
import { SecretDirective } from '../secret.directive';

const MAP = { w: 300, h: 210 };
/** Repère géographique, affiché en pointillé sur la carte. */
const LANDMARK = { id: 'lyon', label: 'Lyon', geo: { lat: 45.764, lon: 4.8357 } };

interface TimelineItem {
  readonly exp: Experience;
  readonly period: string;
  readonly duration: string;
  readonly barWidth: number;
  readonly secretId: string;
  readonly secretText: string;
}

interface MapPoint {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly landmark: boolean;
  readonly anchor: 'start' | 'end';
  readonly dy: number;
}

interface MapModel {
  readonly points: readonly MapPoint[];
  readonly path: string;
  readonly legs: readonly { readonly key: string; readonly label: string }[];
  readonly totalKm: number;
}

@Component({
  selector: 'app-experience-section',
  imports: [SecretDirective],
  templateUrl: './experience-section.html',
  styleUrl: './experience-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceSection {
  protected readonly page = inject(PageContext);
  private readonly today = inject(TODAY);

  protected readonly items: readonly TimelineItem[];
  protected readonly span: string;
  protected readonly cityCount: number;
  protected readonly region: string;
  protected readonly map: MapModel;

  constructor() {
    const experiences = PROFILE.experiences;
    const months = experiences.map((e) => monthsInclusive(e.start, e.end, this.today));
    const longest = Math.max(...months);
    this.items = experiences.map((exp, i) => ({
      exp,
      period: formatPeriod(exp.start, exp.end),
      duration: formatDuration(months[i]),
      barWidth: months[i] / longest,
      secretId: `exp-${exp.id}`,
      secretText: exp.secret.replace('{jours}', String(daysSince(exp.start, this.today))),
    }));

    // Du plus ancien au plus récent, pour tracer le parcours dans l'ordre.
    const chronological = [...experiences].sort((a, b) => a.start.localeCompare(b.start));
    const oldest = chronological[0];
    const latest = chronological[chronological.length - 1];
    this.span = `${oldest.start.slice(0, 4)} → ${latest.end ? formatYearMonth(latest.end) : "aujourd'hui"}`;
    this.cityCount = new Set(experiences.map((e) => e.place.city)).size;
    this.region = oldest.place.region;
    this.map = this.buildMap(chronological);
  }

  private buildMap(chronological: readonly Experience[]): MapModel {
    const geo = [...chronological.map((e) => e.place.geo), LANDMARK.geo];
    const projected = projectToBox(geo, MAP, 38);
    const points: MapPoint[] = chronological.map((e, i) => ({
      id: e.id,
      label: e.place.city,
      x: projected[i].x,
      y: projected[i].y,
      landmark: false,
      anchor: projected[i].x > MAP.w / 2 ? 'end' : 'start',
      dy: i % 2 ? 16 : -9,
    }));
    const lyon = projected[projected.length - 1];
    points.push({ id: LANDMARK.id, label: LANDMARK.label, x: lyon.x, y: lyon.y, landmark: true, anchor: 'start', dy: 4 });

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
}
