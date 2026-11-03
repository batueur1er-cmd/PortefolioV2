import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { SECTION_LABELS, SECTION_ORDER } from '../data/secrets.catalog';
import { SecretsStore } from '../data/secrets.store';

/** Le carnet des secrets, ouvert en popover natif depuis le compteur du dock. */
@Component({
  selector: 'app-secrets-panel',
  template: `
    <header class="head">
      <div>
        <p class="eyebrow">Carnet de fouille</p>
        <h2 class="title" id="secrets-panel-title">Secrets trouvés</h2>
      </div>
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
      <span [style.transform]="'scaleX(' + store.progress() + ')'"></span>
    </div>
    <div class="groups">
      @for (group of groups(); track group.id) {
        <section class="group">
          <h3>
            {{ group.label }} <span>{{ group.found }}/{{ group.items.length }}</span>
          </h3>
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
        </section>
      }
    </div>
    <p class="tip">
      @if (store.complete()) {
        Tout est trouvé : la singularité est ouverte ✦
      } @else {
        Tout trouver ouvre une singularité.
      }
    </p>
    <footer class="actions">
      <button type="button" class="ghost" (click)="store.reset()">Réinitialiser</button>
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
    return SECTION_ORDER.map((id) => {
      const items = this.store.catalog
        .filter((secret) => secret.section === id)
        .map((secret) => ({ ...secret, found: found.has(secret.id) }));
      return { id, label: SECTION_LABELS[id], items, found: items.filter((i) => i.found).length };
    }).filter((group) => group.items.length > 0);
  });
}
