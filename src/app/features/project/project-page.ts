import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TODAY } from '@core/time/time';
import { PROFILE } from '@domain/profile/profile.data';
import { projectById, projectLink } from '@domain/profile/projects';

import { SiteBackstage } from './site/site-backstage';

const SKILLS = new Map(PROFILE.skills.map((s) => [s.id, s]));

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * La page d'un projet, en étude de cas (maquette Stitch « tude_de_cas_drive_en_laravel ») :
 * en-tête, capture principale sur un bandeau, ce qui a été fait, la stack, les autres captures et
 * la navigation vers les projets voisins. Elle n'affiche que le contenu de `profile.data.ts`.
 */
@Component({
  selector: 'app-project-page',
  imports: [RouterLink, NgOptimizedImage, SiteBackstage],
  templateUrl: './project-page.html',
  styleUrl: './project-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.xray]': "mode() === 'xray'",
    '[class.remote]': 'decorative()',
    '[attr.inert]': "decorative() ? '' : null",
    '[attr.aria-hidden]': "decorative() ? 'true' : null",
    '[style.--sy.px]': 'scrollY()',
  },
})
export class ProjectPage {
  /** Identifiant du projet, lu dans l'adresse `/projets/:id`. */
  readonly id = input.required<string>();
  /** « xray » : la copie affichée par une loupe posée sur cette page. */
  readonly mode = input<'surface' | 'xray'>('surface');
  /** Copie dans une loupe : ni titre de fenêtre, ni interactions. */
  readonly decorative = input(false);
  /** Défilement de la vraie page, pour recaler la barre du haut dans la copie. */
  readonly scrollY = input(0);

  protected readonly fullName = `${PROFILE.firstName} ${PROFILE.lastName}`;
  protected readonly year = inject(TODAY).getFullYear();
  protected readonly link = projectLink;
  protected readonly pad = pad;
  protected readonly project = computed(() => projectById(this.id()));

  private readonly position = computed(() => PROFILE.projects.findIndex((p) => p.id === this.id()));
  protected readonly number = computed(() => pad(this.position() + 1));
  protected readonly previous = computed(() => PROFILE.projects[this.position() - 1]);
  protected readonly next = computed(() => {
    const i = this.position();
    return i >= 0 ? PROFILE.projects[i + 1] : undefined;
  });

  /** Stack en une ligne, pour la puce de l'en-tête. */
  protected readonly stackLine = computed(() =>
    (this.project()?.skills ?? []).map((id) => SKILLS.get(id)?.label ?? id).join(' · '),
  );

  /** Stack rangée par famille de compétences, pour la carte latérale. */
  protected readonly stackGroups = computed(() => {
    const ids = this.project()?.skills ?? [];
    return PROFILE.skillGroups
      .map((group) => ({
        label: group.label,
        tags: ids.flatMap((id) => {
          const skill = SKILLS.get(id);
          return skill?.group === group.id ? [skill.label] : [];
        }),
      }))
      .filter((group) => group.tags.length);
  });

  /** Première capture en grand, les autres dans la galerie. */
  protected readonly hero = computed(() => this.project()?.images?.[0]);
  protected readonly gallery = computed(() => this.project()?.images?.slice(1) ?? []);
}
