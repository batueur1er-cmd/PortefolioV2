import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';

import { observeResize, offsetWithin, whenFontsReady } from '@core/dom/dom';
import { clockDelay } from '@core/time/clock';
import { SecretHost } from '@features/secrets/secret-host';
import { ScrollStage } from '@shared/motion/scroll-stage';

import { AboutSection } from './about/about-section';
import { ContactSection } from './contact/contact-section';
import { EducationSection } from './education/education-section';
import { ExperienceSection } from './experience/experience-section';
import { HeroSection } from './hero/hero-section/hero-section';
import { SiteNav } from './nav/site-nav';
import { PageContext, PageMode } from './page-context';
import { ProjectsSection } from './projects/projects-section/projects-section';
import { SkillsSection } from './skills/skills-section';

/**
 * La page complète du portfolio. Elle est rendue à l'identique en surface et en rayons X :
 * seule la peau change, jamais la mise en page. Elle fournit aux sections tout ce qu'elles
 * doivent savoir de l'exemplaire qui les affiche : mode, défilement, registre des secrets.
 */
@Component({
  selector: 'app-portfolio-page',
  imports: [
    SiteNav,
    HeroSection,
    AboutSection,
    ExperienceSection,
    ProjectsSection,
    SkillsSection,
    EducationSection,
    ContactSection,
  ],
  providers: [
    { provide: PageContext, useExisting: forwardRef(() => PortfolioPage) },
    { provide: SecretHost, useExisting: forwardRef(() => PortfolioPage) },
    { provide: ScrollStage, useExisting: forwardRef(() => PortfolioPage) },
  ],
  template: `
    <app-site-nav />
    <main [attr.id]="anchor('contenu')" tabindex="-1">
      <app-hero-section />
      <app-about-section />
      <app-experience-section />
      <app-projects-section />
      <app-skills-section />
      <app-education-section />
      <app-contact-section />
    </main>
  `,
  styleUrl: './portfolio-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.xray]': "mode() === 'xray'",
    '[class.remote]': 'remote()',
    '[class.intro]': '!decorative()',
    '[attr.inert]': 'decorative() ? "" : null',
    '[style.--vh]': 'vh()',
    '[style.--sy]': 'scrollY()',
    '[style.--clock]': 'clock',
  },
})
export class PortfolioPage implements PageContext, SecretHost, ScrollStage {
  readonly mode = input<PageMode>('surface');
  /** Hauteur de la fenêtre portfolio : la loupe s'en sert pour reproduire les sections plein écran. */
  readonly vh = input(800);
  /** Défilement de la fenêtre portfolio, qui pilote les animations liées au défilement. */
  readonly scrollY = input(0);
  /** Copie affichée dans une loupe : pas d'ancres, pour ne pas dupliquer les identifiants. */
  readonly decorative = input(false);
  /** Copie affichée dans une autre fenêtre : elle ne défile pas, les éléments collants sont simulés. */
  readonly remote = input(false);

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly layoutVersion = signal(0);
  readonly layout = this.layoutVersion.asReadonly();
  /** Cale les animations en boucle sur l'horloge commune : voir `clockDelay`. */
  protected readonly clock = clockDelay();

  private readonly registry = new Map<string, Element>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    const doc = inject(DOCUMENT);
    afterNextRender(() => {
      const bump = () => this.layoutVersion.update((v) => v + 1);
      observeResize([this.element], bump, destroyRef);
      whenFontsReady(doc, bump);
    });
  }

  register(id: string, element: Element): void {
    this.registry.set(id, element);
  }

  unregister(id: string, element: Element): void {
    if (this.registry.get(id) === element) this.registry.delete(id);
  }

  secretElements(): ReadonlyMap<string, Element> {
    return this.registry;
  }

  anchor(name: string): string | null {
    return this.decorative() ? null : name;
  }

  /** Sections de la page et leur position, pour savoir laquelle est sous un point. */
  sections(): { readonly id: string; readonly label: string; readonly top: number }[] {
    return Array.from(this.element.querySelectorAll<HTMLElement>('[data-section]'), (el) => ({
      id: el.dataset['section'] ?? '',
      label: el.dataset['label'] ?? '',
      top: offsetWithin(el, this.element).y,
    }));
  }

  /** Petit éclair sur un secret qui vient d'être trouvé. */
  flash(id: string): void {
    const element = this.registry.get(id);
    if (!element) return;
    element.classList.remove('just');
    void element.getBoundingClientRect();
    element.classList.add('just');
  }
}
