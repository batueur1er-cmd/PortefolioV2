import { ChangeDetectionStrategy, Component, VERSION, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PROFILE } from '../../core/profile.data';
import { PageContext } from '../page-context';
import { SecretDirective } from '../secret.directive';

@Component({
  selector: 'app-site-nav',
  imports: [RouterLink, SecretDirective],
  template: `
    <nav class="wrap nav" data-x="&lt;app-site-nav&gt;" aria-label="Navigation principale">
      <a class="brand" routerLink="/" fragment="accueil">
        <span class="monogram" aria-hidden="true">BN</span>
        <span>{{ profile.firstName }} {{ profile.lastName }}</span>
      </a>
      <ul class="links">
        @for (link of links; track link.id) {
          <li><a routerLink="/" [fragment]="link.id">{{ link.label }}</a></li>
        }
      </ul>
      <span class="chip version" appSecret="nav-version">v2.0 · reconstruit en Angular {{ angularMajor }}</span>
    </nav>
  `,
  styleUrl: './site-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteNav {
  protected readonly page = inject(PageContext);
  protected readonly profile = PROFILE;
  protected readonly angularMajor = VERSION.major;
  protected readonly links = [
    { id: 'parcours', label: 'Parcours' },
    { id: 'realisations', label: 'Réalisations' },
    { id: 'competences', label: 'Compétences' },
    { id: 'contact', label: 'Contact' },
  ] as const;
}
