import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';

import { offsetWithin } from '@core/dom/dom';
import { Point } from '@core/geometry/geometry';
import { PROFILE } from '@domain/profile/profile.data';
import { coOccurrence, skillSources, sourceSummary, sourcesBySkill } from '@domain/skills/skills-graph';
import { SecretDirective } from '@features/secrets/secret.directive';
import { RevealDirective } from '@shared/motion/reveal.directive';
import { ScrollStage } from '@shared/motion/scroll-stage';
import { SectionHeader } from '@shared/ui/section-header';

import { PageContext } from '../page-context';

interface Node extends Point {
  readonly id: string;
}

const SOURCES = skillSources(PROFILE);
const BY_SKILL = sourcesBySkill(SOURCES);
const EDGES = coOccurrence(SOURCES);

/** Compétences liées à chacune, par co-occurrence. */
const NEIGHBOURS = EDGES.reduce((map, edge) => {
  map.set(edge.a, [...(map.get(edge.a) ?? []), edge.b]);
  map.set(edge.b, [...(map.get(edge.b) ?? []), edge.a]);
  return map;
}, new Map<string, string[]>());

/** Courbe légèrement bombée entre deux compétences. */
function curve(a: Point, b: Point): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const bend = 0.28;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${(mx - dy * bend).toFixed(1)} ${(my + dx * bend).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

@Component({
  selector: 'app-skills-section',
  imports: [SecretDirective, SectionHeader, RevealDirective],
  templateUrl: './skills-section.html',
  styleUrl: './skills-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsSection {
  protected readonly page = inject(PageContext);
  private readonly stage = inject(ScrollStage);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly headline = PROFILE.headlines.competences;
  protected readonly count = PROFILE.skills.length;
  protected readonly groups = PROFILE.skillGroups.map((group, index) => ({
    ...group,
    index: String(index + 1).padStart(2, '0'),
    skills: PROFILE.skills
      .filter((skill) => skill.group === group.id)
      .map((skill) => ({
        ...skill,
        sources: sourceSummary(BY_SKILL.get(skill.id) ?? []),
        usedIn: (BY_SKILL.get(skill.id) ?? []).join(', '),
      })),
  }));
  protected readonly linkedinTop = PROFILE.linkedinTopSkills.map((label, i) => `  ${i + 1}. ${label}`).join('\n');

  /** Compétence survolée : ses voisines s'allument. Pure couleur, la mise en page ne bouge pas. */
  protected readonly hovered = signal<string | null>(null);
  protected readonly near = computed(() => new Set(NEIGHBOURS.get(this.hovered() ?? '') ?? []));

  /** Le graphe se dessine entre les vraies positions des étiquettes, mesurées dans la page. */
  private readonly measured = computed(() => {
    this.stage.layout();
    const stage = this.host.querySelector<HTMLElement>('.stage');
    if (!stage) return { w: 1, h: 1, nodes: [] as Node[] };
    const nodes = Array.from(stage.querySelectorAll<HTMLElement>('[data-skill]'), (tag) => {
      const offset = offsetWithin(tag, stage);
      return { id: tag.dataset['skill'] ?? '', x: offset.x + tag.offsetWidth / 2, y: offset.y + tag.offsetHeight / 2 };
    });
    return { w: Math.max(1, stage.offsetWidth), h: Math.max(1, stage.offsetHeight), nodes };
  });

  protected readonly viewBox = computed(() => `0 0 ${this.measured().w} ${this.measured().h}`);
  protected readonly dots = computed(() => this.measured().nodes);
  protected readonly edges = computed(() => {
    const byId = new Map(this.measured().nodes.map((node) => [node.id, node]));
    return EDGES.flatMap((edge) => {
      const a = byId.get(edge.a);
      const b = byId.get(edge.b);
      return a && b ? [{ key: `${edge.a}|${edge.b}`, d: curve(a, b), width: 0.7 + edge.weight * 0.5 }] : [];
    });
  });
}
