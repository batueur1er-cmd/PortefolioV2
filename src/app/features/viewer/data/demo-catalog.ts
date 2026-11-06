/** Un modèle d'exemple du visualiseur (construit par `scene/demo-models.ts`). */
export interface DemoModel {
  readonly id: string;
  readonly name: string;
  /** Une ligne sous le bouton. */
  readonly caption: string;
}

/** Les modèles d'exemple, dans l'ordre des boutons. Le premier s'affiche à l'ouverture. */
export const DEMO_MODELS: readonly DemoModel[] = [
  { id: 'boite-de-vitesses', name: 'Boîte de vitesses', caption: 'Un carter fermé, et ce qui tourne dedans.' },
  { id: 'colis', name: 'Le colis', caption: 'Bien scotché : impossible de voir dedans à l’œil nu.' },
  { id: 'theiere', name: 'Théière de l’Utah', caption: 'Le modèle d’essai historique de la 3D.' },
];

export const DEFAULT_DEMO = DEMO_MODELS[0];
