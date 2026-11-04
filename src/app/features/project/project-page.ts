import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { PROFILE } from '@domain/profile/profile.data';
import { projectById, projectLink, skillLabelsOf } from '@domain/profile/projects';
import { TagList } from '@shared/ui/tag-list';

/**
 * La page d'un projet : son contexte, ce qui a été fait, la stack et toutes les captures.
 * Elle n'affiche que le contenu de `profile.data.ts` : pour l'enrichir, c'est là qu'il faut écrire.
 */
@Component({
  selector: 'app-project-page',
  imports: [RouterLink, TagList, NgOptimizedImage],
  template: `
    <header class="bar">
      <div class="wrap bar-in">
        <a class="brand" routerLink="/">
          <span class="monogram" aria-hidden="true">BN</span>
          <span class="brand-name">{{ fullName }}</span>
        </a>
        <a class="back" routerLink="/" fragment="realisations">
          <span aria-hidden="true">←</span> Toutes les réalisations
        </a>
      </div>
    </header>

    @if (project(); as p) {
      <main class="wrap page" id="contenu" tabindex="-1">
        <p class="kicker">
          <span class="index">{{ number() }}</span>
          <span class="rule" aria-hidden="true"></span>
          <span>{{ p.context }}</span>
          @if (p.year; as year) {
            <span class="year">{{ year }}</span>
          }
        </p>
        <h1 class="title">{{ p.title }}</h1>
        <p class="summary">{{ p.summary }}</p>

        <div class="facts">
          <section class="block" aria-labelledby="fait">
            <h2 id="fait" class="label">Ce que j'ai fait</h2>
            <ol class="highlights">
              @for (line of p.highlights; track line) {
                <li [style.--i]="$index">{{ line }}</li>
              }
            </ol>
          </section>
          <aside class="side">
            <section class="block" aria-labelledby="stack">
              <h2 id="stack" class="label">Stack</h2>
              <app-tag-list [tags]="skills()" />
            </section>
            @if (p.repo; as repo) {
              <a class="repo" [href]="repo" target="_blank" rel="noopener">
                Voir le dépôt GitHub <span aria-hidden="true">↗</span>
                <span class="sr-only">(nouvel onglet)</span>
              </a>
            }
          </aside>
        </div>

        @if (p.images?.length) {
          <section class="gallery" aria-labelledby="captures">
            <h2 id="captures" class="label">Captures</h2>
            <ul class="shots">
              @for (image of p.images; track image.src) {
                <li class="shot" [style.--i]="$index">
                  <img [ngSrc]="image.src" [alt]="image.alt" fill sizes="(max-width: 1200px) 100vw, 75vw" [priority]="$first" />
                </li>
              }
            </ul>
          </section>
        }

        <nav class="pager" aria-label="Autres projets">
          @if (previous(); as prev) {
            <a class="step prev" [routerLink]="link(prev.id)">
              <span class="dir">← Précédent</span>
              <span class="step-title">{{ prev.title }}</span>
            </a>
          } @else {
            <span></span>
          }
          @if (next(); as nxt) {
            <a class="step next" [routerLink]="link(nxt.id)">
              <span class="dir">Suivant →</span>
              <span class="step-title">{{ nxt.title }}</span>
            </a>
          }
        </nav>
      </main>
    } @else {
      <main class="wrap page missing" id="contenu" tabindex="-1">
        <h1 class="title">Projet introuvable</h1>
        <p class="summary">Ce projet n'existe pas, ou plus sous cette adresse.</p>
        <a class="repo" routerLink="/" fragment="realisations">← Revenir aux réalisations</a>
      </main>
    }
  `,
  styleUrl: './project-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPage {
  /** Identifiant du projet, lu dans l'adresse `/projets/:id`. */
  readonly id = input.required<string>();

  protected readonly fullName = `${PROFILE.firstName} ${PROFILE.lastName}`;
  protected readonly link = projectLink;
  protected readonly project = computed(() => projectById(this.id()));
  protected readonly skills = computed(() => skillLabelsOf(this.project()?.skills ?? []));

  private readonly position = computed(() => PROFILE.projects.findIndex((p) => p.id === this.id()));
  protected readonly number = computed(() => String(this.position() + 1).padStart(2, '0'));
  protected readonly previous = computed(() => PROFILE.projects[this.position() - 1]);
  protected readonly next = computed(() => {
    const i = this.position();
    return i >= 0 ? PROFILE.projects[i + 1] : undefined;
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      const p = this.project();
      title.setTitle(p ? `${p.title} — ${this.fullName}` : `Projet introuvable — ${this.fullName}`);
    });
  }
}
