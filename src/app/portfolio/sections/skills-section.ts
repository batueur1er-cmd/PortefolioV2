import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { observeResize, offsetWithin, whenFontsReady } from '../../core/dom';
import { Point } from '../../core/geometry';
import { PROFILE } from '../../core/profile.data';
import { coOccurrence, skillSources, sourceSummary, sourcesBySkill } from '../../core/skills-graph';
import { PageContext } from '../page-context';
import { SecretDirective } from '../secret.directive';

interface Node extends Point {
  readonly id: string;
}

const SOURCES = skillSources(PROFILE);
const BY_SKILL = sourcesBySkill(SOURCES);
const EDGES = coOccurrence(SOURCES);

/** Courbe légèrement bombée entre deux compétences. */
function curve(a: Point, b: Point): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Les étiquettes sont empilées : les arcs bombent vers la gauche pour rester visibles.
  const bend = 0.32;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${(mx - dy * bend).toFixed(1)} ${(my + dx * bend).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

@Component({
  selector: 'app-skills-section',
  imports: [SecretDirective],
  templateUrl: './skills-section.html',
  styleUrl: './skills-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsSection {
  protected readonly page = inject(PageContext);
  protected readonly count = PROFILE.skills.length;
  protected readonly groups = PROFILE.skillGroups.map((group) => ({
    ...group,
    skills: PROFILE.skills
      .filter((skill) => skill.group === group.id)
      .map((skill) => ({ ...skill, sources: sourceSummary(BY_SKILL.get(skill.id) ?? []) })),
  }));
  protected readonly linkedinTop = PROFILE.linkedinTopSkills.map((label, i) => `  ${i + 1}. ${label}`).join('\n');

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly box = signal({ w: 1, h: 1 });
  private readonly nodes = signal<readonly Node[]>([]);

  protected readonly viewBox = computed(() => `0 0 ${this.box().w} ${this.box().h}`);
  protected readonly dots = this.nodes.asReadonly();
  /** Le graphe se dessine entre les vraies positions des étiquettes, mesurées dans la page. */
  protected readonly edges = computed(() => {
    const byId = new Map(this.nodes().map((node) => [node.id, node]));
    return EDGES.flatMap((edge) => {
      const a = byId.get(edge.a);
      const b = byId.get(edge.b);
      return a && b ? [{ key: `${edge.a}|${edge.b}`, d: curve(a, b), width: 0.8 + edge.weight * 0.6 }] : [];
    });
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    const doc = inject(DOCUMENT);
    afterNextRender(() => {
      const stage = this.stage().nativeElement;
      const tags = Array.from(stage.querySelectorAll<HTMLElement>('[data-skill]'));
      const measure = () => {
        this.box.set({ w: Math.max(1, stage.offsetWidth), h: Math.max(1, stage.offsetHeight) });
        this.nodes.set(
          tags.map((tag) => {
            const offset = offsetWithin(tag, stage);
            return {
              id: tag.dataset['skill'] ?? '',
              x: offset.x + tag.offsetWidth / 2,
              y: offset.y + tag.offsetHeight / 2,
            };
          }),
        );
      };
      observeResize([stage, ...tags], measure, destroyRef);
      whenFontsReady(doc, measure);
    });
  }
}
