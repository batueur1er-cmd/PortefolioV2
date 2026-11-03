import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';

import { PageContext, PageMode } from './page-context';
import { AboutSection } from './sections/about-section';
import { ContactSection } from './sections/contact-section';
import { EducationSection } from './sections/education-section';
import { ExperienceSection } from './sections/experience-section';
import { HeroSection } from './sections/hero-section';
import { ProjectsSection } from './sections/projects-section';
import { SiteNav } from './sections/site-nav';
import { SkillsSection } from './sections/skills-section';
import { UnderTheHoodSection } from './sections/under-the-hood-section';

/**
 * La page complète du portfolio. Elle est rendue à l'identique en surface et en rayons X :
 * seule la peau change, jamais la mise en page.
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
    UnderTheHoodSection,
    ContactSection,
  ],
  providers: [{ provide: PageContext, useExisting: forwardRef(() => PortfolioPage) }],
  template: `
    <app-site-nav />
    <main [attr.id]="anchor('contenu')" tabindex="-1">
      <app-hero-section />
      <app-about-section />
      <app-experience-section />
      <app-projects-section />
      <app-skills-section />
      <app-education-section />
      <app-under-the-hood-section />
      <app-contact-section />
    </main>
  `,
  styleUrl: './portfolio-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.xray]': "mode() === 'xray'",
    '[style.--vh]': 'vh()',
  },
})
export class PortfolioPage implements PageContext {
  readonly mode = input<PageMode>('surface');
  /** Hauteur de la fenêtre portfolio : la loupe s'en sert pour reproduire les sections plein écran. */
  readonly vh = input(800);
  /** Copie affichée dans une loupe : pas d'ancres, pour ne pas dupliquer les identifiants. */
  readonly decorative = input(false);

  private readonly registry = new Map<string, Element>();

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

  /** Petit éclair sur un secret qui vient d'être trouvé. */
  flash(id: string): void {
    const element = this.registry.get(id);
    if (!element) return;
    element.classList.remove('just');
    void element.getBoundingClientRect();
    element.classList.add('just');
  }
}
