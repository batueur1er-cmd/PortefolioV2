import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { SECTION_LABELS, SECTION_ORDER } from '../core/secrets.catalog';
import { SecretsStore } from '../core/secrets.store';

/** Le carnet des secrets, ouvert en popover natif depuis le compteur du dock. */
@Component({
  selector: 'app-secrets-panel',
  template: `
    <header class="head">
      <h2 class="title" id="secrets-panel-title">Secrets trouvés</h2>
      <p class="score">
        {{ store.count() }}<span>/{{ store.total }}</span>
      </p>
    </header>
    <div
      class="bar"
      role="progressbar"
      aria-labelledby="secrets-panel-title"
      aria-valuemin="0"
      [attr.aria-valuemax]="store.total"
      [attr.aria-valuenow]="store.count()"
    >
      <span [style.width.%]="store.progress() * 100"></span>
    </div>
    <div class="groups">
      @for (group of groups(); track group.id) {
        <h3 class="group">{{ group.label }}</h3>
        <ul>
          @for (item of group.items; track item.id) {
            <li [class.found]="item.found">
              @if (item.found) {
                {{ item.label }}
              } @else {
                <span aria-hidden="true">? ? ?</span><span class="sr-only">Secret non trouvé</span>
              }
            </li>
          }
        </ul>
      }
    </div>
    <p class="tip">Tous trouvés ? Une singularité se débloque.</p>
    <footer class="actions">
      <button type="button" (click)="store.reset()">Réinitialiser</button>
      <button type="button" popovertarget="secrets-panel" popovertargetaction="hide">Fermer</button>
    </footer>
  `,
  styleUrl: './secrets-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    id: 'secrets-panel',
    popover: '',
    role: 'dialog',
    'aria-labelledby': 'secrets-panel-title',
  },
})
export class SecretsPanel {
  protected readonly store = inject(SecretsStore);

  protected readonly groups = computed(() => {
    const found = this.store.found();
    return SECTION_ORDER.map((id) => ({
      id,
      label: SECTION_LABELS[id],
      items: this.store.catalog
        .filter((secret) => secret.section === id)
        .map((secret) => ({ ...secret, found: found.has(secret.id) })),
    })).filter((group) => group.items.length > 0);
  });
}
