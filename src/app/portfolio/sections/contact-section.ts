import { ChangeDetectionStrategy, Component, VERSION, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PROFILE } from '../../core/profile.data';
import { SecretsStore } from '../../core/secrets.store';
import { TODAY } from '../../core/time';
import { PageContext } from '../page-context';
import { SecretDirective } from '../secret.directive';

@Component({
  selector: 'app-contact-section',
  imports: [RouterLink, SecretDirective],
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSection {
  protected readonly page = inject(PageContext);
  protected readonly store = inject(SecretsStore);
  protected readonly contact = PROFILE.contact;
  protected readonly fullName = `${PROFILE.firstName} ${PROFILE.lastName}`;
  protected readonly location = PROFILE.location;
  protected readonly year = inject(TODAY).getFullYear();
  protected readonly angularMajor = VERSION.major;
}
