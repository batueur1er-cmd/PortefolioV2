import { ChangeDetectionStrategy, Component, ElementRef, computed, inject } from '@angular/core';

import { TODAY } from '@core/time/time';
import { careerMap, careerTotals, timeline } from '@domain/career/career';
import { PROFILE } from '@domain/profile/profile.data';
import { SecretDirective } from '@features/secrets/secret.directive';
import { RevealDirective } from '@shared/motion/reveal.directive';
import { ScrollStage, stageTop } from '@shared/motion/scroll-stage';
import { SectionHeader } from '@shared/ui/section-header/section-header';
import { TagList } from '@shared/ui/tag-list';

import { PageContext } from '../page-context';
import { CareerMap } from './career-map';

/** Repère de lecture : la frise se remplit quand il descend. */
const READ_LINE = 0.55;

const SKILL_LABELS = new Map(PROFILE.skills.map((s) => [s.id, s.label]));

@Component({
  selector: 'app-experience-section',
  imports: [SecretDirective, SectionHeader, RevealDirective, TagList, CareerMap],
  templateUrl: './experience-section.html',
  styleUrl: './experience-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceSection {
  protected readonly page = inject(PageContext);
  private readonly stage = inject(ScrollStage);
  private readonly today = inject(TODAY);

  protected readonly headline = PROFILE.headlines.parcours;
  protected readonly items = timeline(PROFILE, this.today).map((item) => ({
    ...item,
    skills: item.exp.skills.map((id) => SKILL_LABELS.get(id) ?? id),
  }));
  protected readonly totals = careerTotals(PROFILE, this.today);
  protected readonly map = careerMap(PROFILE, { w: 300, h: 210 }, { id: 'lyon', label: 'Lyon', geo: { lat: 45.764, lon: 4.8357 } });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Positions mesurées dans la page, refaites quand la mise en page bouge. */
  private readonly box = computed(() => {
    this.stage.layout();
    const list = this.host.querySelector<HTMLElement>('.timeline');
    if (!list) return { top: 0, height: 1, entries: [] as number[] };
    return {
      top: stageTop(this.stage, list),
      height: list.offsetHeight,
      entries: Array.from(list.querySelectorAll<HTMLElement>('.entry'), (e) => stageTop(this.stage, e)),
    };
  });

  private readonly line = computed(() => this.stage.scrollY() + this.stage.vh() * READ_LINE);

  /** Remplissage de la frise, de 0 à 1. */
  protected readonly progress = computed(() => {
    const { top, height } = this.box();
    return Math.min(1, Math.max(0, (this.line() - top) / Math.max(1, height))).toFixed(4);
  });

  /** Nombre d'étapes déjà franchies par le repère. */
  protected readonly passed = computed(() => this.box().entries.filter((top) => top + 24 < this.line()).length);
}
