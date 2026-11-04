import { ChangeDetectionStrategy, Component, DOCUMENT, VERSION, afterNextRender, computed, inject } from '@angular/core';

import { PROFILE } from '@domain/profile/profile.data';
import { SecretDirective } from '@features/secrets/secret.directive';
import { ScrollStage, stageTop } from '@shared/motion/scroll-stage';


/** Repère vertical (en part de fenêtre) qui décide de la section active. */
const SPY_LINE = 0.35;

/**
 * La barre de navigation, collée en haut. Elle montre la progression de lecture et la section en
 * cours, calculées depuis le défilement de la scène : la copie rayons X affiche la même chose.
 */
@Component({
  selector: 'app-site-nav',
  imports: [SecretDirective],
  template: `
    <nav class="nav" data-x="&lt;app-site-nav&gt; · position: sticky" aria-label="Navigation principale">
      <div class="wrap bar">
        <a class="brand" href="#accueil" (click)="go($event, 'accueil')">
          <span class="monogram" aria-hidden="true">BN</span>
          <span class="brand-name">{{ fullName }}</span>
        </a>
        <ul class="links">
          @for (link of links; track link.id) {
            <li>
              <a [href]="'#' + link.id" (click)="go($event, link.id)" [class.active]="active() === link.id" [attr.aria-current]="active() === link.id ? 'true' : null">
                <span class="num" aria-hidden="true">{{ link.num }}</span>{{ link.label }}
              </a>
            </li>
          }
        </ul>
        <span class="chip version" appSecret="nav-version">v2.1 · reconstruit en Angular {{ angularMajor }} · zoneless</span>
      </div>
      <span class="progress" aria-hidden="true" [style.transform]="'scaleX(' + progress() + ')'"></span>
    </nav>
  `,
  styleUrl: './site-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteNav {
  private readonly stage = inject(ScrollStage);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    // Arrivée avec une ancre dans l'adresse (#contact…) : on y va une fois la page dessinée.
    afterNextRender(() => {
      const id = this.doc.location.hash.slice(1);
      if (id) setTimeout(() => this.scrollTo(id, 'auto'), 60);
    });
  }

  /** Défile en douceur jusqu'à la section, sous la barre, et met l'adresse à jour. */
  protected go(event: MouseEvent, id: string): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    this.scrollTo(id, 'smooth');
    this.doc.defaultView?.history.replaceState(null, '', '#' + id);
  }

  private scrollTo(id: string, behavior: ScrollBehavior): void {
    const win = this.doc.defaultView;
    const target = this.doc.getElementById(id);
    if (!win || !target) return;
    const bar = (this.doc.querySelector('.nav') as HTMLElement | null)?.offsetHeight ?? 0;
    const top = id === 'accueil' ? 0 : target.getBoundingClientRect().top + win.scrollY - bar;
    const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    win.scrollTo({ top, behavior: reduced ? 'auto' : behavior });
    // Le focus suit, pour le clavier et les lecteurs d'écran, sans refaire défiler.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  protected readonly fullName = `${PROFILE.firstName} ${PROFILE.lastName}`;
  protected readonly angularMajor = VERSION.major;
  protected readonly links = [
    { id: 'profil', num: '01', label: 'Profil' },
    { id: 'parcours', num: '02', label: 'Parcours' },
    { id: 'realisations', num: '03', label: 'Réalisations' },
    { id: 'competences', num: '04', label: 'Compétences' },
    { id: 'contact', num: '06', label: 'Contact' },
  ] as const;

  /** Progression de lecture, de 0 à 1. */
  protected readonly progress = computed(() => {
    this.stage.layout();
    const max = this.stage.element.offsetHeight - this.stage.vh();
    return max > 0 ? Math.min(1, Math.max(0, this.stage.scrollY() / max)).toFixed(4) : '0';
  });

  /** Dernière section dont le haut a passé le repère. */
  protected readonly active = computed(() => {
    this.stage.layout();
    const line = this.stage.scrollY() + this.stage.vh() * SPY_LINE;
    let current: string | null = null;
    for (const section of this.sections()) {
      if (section.top <= line) current = section.id;
    }
    return current;
  });

  private readonly sections = computed(() => {
    this.stage.layout();
    const root = this.stage.element;
    return this.links.flatMap((link) => {
      const el = root.querySelector<HTMLElement>(`[data-section="${link.id}"]`);
      return el ? [{ id: link.id as string, top: stageTop(this.stage, el) }] : [];
    });
  });
}
