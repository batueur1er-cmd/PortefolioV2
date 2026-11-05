export interface AchievementDef {
  readonly id: string;
  readonly label: string;
  /** Comment l'obtenir : affiché une fois débloqué (le terminal montre « ??? » avant). */
  readonly hint: string;
}

/** Les succès cachés. Contrairement aux secrets, ils restent acquis d'une visite à l'autre. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'premier-secret', label: 'Premier secret', hint: 'Trouver un premier secret avec la loupe.' },
  { id: 'tous-les-secrets', label: 'Chasseur de secrets', hint: 'Trouver tous les secrets.' },
  { id: 'singularite', label: 'Horizon des événements', hint: 'Ouvrir la singularité.' },
  { id: 'trois-fenetres', label: 'Triple vue', hint: 'Ouvrir le site dans trois fenêtres en même temps.' },
  { id: 'nuit-rayons-x', label: 'Vision nocturne', hint: 'Passer en mode nuit pendant qu’une loupe est ouverte.' },
  { id: 'konami-loupe', label: 'Code dans la loupe', hint: 'Taper le code Konami dans la fenêtre loupe.' },
  { id: 'zoom-extreme', label: 'Grossissement extrême', hint: 'Pousser la loupe à ×3,0, ou la reculer à ×0,5.' },
  { id: 'explorateur', label: 'Explorateur', hint: 'Visiter trois pages projet.' },
  { id: 'cv', label: 'Recruteur averti', hint: 'Télécharger le CV.' },
  { id: 'version-simple', label: 'Droit au but', hint: 'Essayer la version simple.' },
  { id: 'terminal', label: 'Sous le capot', hint: 'Ouvrir le terminal caché.' },
];

export const ACHIEVEMENT_BY_ID: ReadonlyMap<string, AchievementDef> = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Pages projet à visiter pour « Explorateur ». */
export const EXPLORER_PAGES = 3;
