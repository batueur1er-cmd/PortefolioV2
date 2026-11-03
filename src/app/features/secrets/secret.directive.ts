import { Directive, ElementRef, computed, effect, inject, input, isDevMode } from '@angular/core';

import { SECRET_IDS } from './data/secrets.catalog';
import { SecretHost } from './secret-host';

/**
 * Marque un élément comme secret : invisible en surface, révélé par la loupe.
 * Il est positionné en absolu pour ne jamais modifier la mise en page.
 */
@Directive({
  selector: '[appSecret]',
  host: {
    class: 'x',
    '[attr.data-secret]': 'id()',
    '[attr.aria-hidden]': 'hidden()',
  },
})
export class SecretDirective {
  readonly id = input.required<string>({ alias: 'appSecret' });

  private readonly host = inject(SecretHost);
  private readonly element = inject<ElementRef<Element>>(ElementRef).nativeElement;
  protected readonly hidden = computed(() => (this.host.mode() === 'surface' ? 'true' : null));

  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      if (isDevMode() && !SECRET_IDS.has(id)) {
        console.warn(`[appSecret] « ${id} » n'existe pas dans secrets.catalog.ts`);
      }
      this.host.register(id, this.element);
      onCleanup(() => this.host.unregister(id, this.element));
    });
  }
}
