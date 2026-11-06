import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { LevelStats } from '../../engine/engine';

/**
 * Les étapes du rendu de Doom, expliquées une à une. Chaque texte en clair a son pendant
 * technique (les noms du code source de Doom, les limites, les chiffres de ce niveau), à la même
 * place : la loupe le révèle aux rayons X.
 */
@Component({
  selector: 'app-doom-steps',
  templateUrl: './doom-steps.html',
  styleUrl: './doom-steps.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoomSteps {
  readonly stats = input.required<LevelStats>();
}
