import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TODAY } from '@core/time/time';
import { PROFILE } from '@domain/profile/profile.data';

import { CHAPTERS } from './chapters';

/**
 * Le colophon : comment ce site est fait. À la surface, tout le texte est caviardé. Seule la copie
 * d'une loupe le rend lisible : expliquer la loupe sans la dévoiler à qui ne l'a pas trouvée.
 */
@Component({
  selector: 'app-making-of-page',
  imports: [RouterLink],
  templateUrl: './making-of-page.html',
  styleUrl: './making-of-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.xray]': "mode() === 'xray'",
    '[attr.inert]': "decorative() ? '' : null",
    '[attr.aria-hidden]': "decorative() ? 'true' : null",
  },
})
export class MakingOfPage {
  readonly mode = input<'surface' | 'xray'>('surface');
  /** Copie dans une loupe : aucune interaction. */
  readonly decorative = input(false);

  protected readonly chapters = CHAPTERS;
  protected readonly fullName = `${PROFILE.firstName} ${PROFILE.lastName}`;
  protected readonly year = inject(TODAY).getFullYear();
}
