import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LANG, followLang } from '@core/i18n/lang';
import { translateDom } from '@core/i18n/translate';
import { ThemeStore } from '@core/theme/theme.store';
import { EN, EN_RULES } from '@domain/profile/en';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Instancié dès le démarrage, dans le portfolio comme dans la loupe, pour appliquer le thème.
  protected readonly theme = inject(ThemeStore);

  constructor() {
    const doc = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);
    doc.documentElement.lang = LANG;
    destroyRef.onDestroy(followLang(doc.defaultView));
    if (LANG === 'en') afterNextRender(() => destroyRef.onDestroy(translateDom(doc.body, EN, EN_RULES)));
  }
}
