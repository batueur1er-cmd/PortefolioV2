import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeStore } from '@core/theme/theme.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Instancié dès le démarrage, dans le portfolio comme dans la loupe, pour appliquer le thème.
  protected readonly theme = inject(ThemeStore);
}
