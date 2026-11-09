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
  { id: 'tour-complet', label: 'Tour complet', hint: 'Visiter toutes les pages projet.' },
  { id: 'lecteur-de-plans', label: 'Lecteur de plans', hint: 'Regarder le schéma de principe de chaque projet qui en a un.' },
  { id: 'pilule-rouge', label: 'Pilule rouge', hint: 'Entrer dans la matrice depuis le terminal.' },
  { id: 'code-ouvert', label: 'Code ouvert', hint: 'Ouvrir un dépôt GitHub depuis une page projet.' },
  { id: 'vision-3d', label: 'Vision 3D', hint: 'Regarder le visualiseur 3D à travers la loupe.' },
  { id: 'modeliste', label: 'Modéliste', hint: 'Importer son propre fichier OBJ dans le visualiseur 3D.' },
  { id: 'rayons-x-retro', label: 'Rayons X rétro', hint: 'Regarder la démo façon Doom à travers la loupe.' },
  { id: 'image-par-image', label: 'Image par image', hint: 'Regarder une image de la démo façon Doom se dessiner jusqu’au bout.' },
  { id: 'plus-de-visplanes', label: 'Plus de visplanes', hint: 'Faire planter la démo façon Doom en entrant dans le damier.' },
  { id: 'coffres-caches', label: 'Pilleur de murs', hint: 'Trouver à la loupe tous les coffres cachés de la démo façon Doom.' },
  { id: 'archeologue', label: 'Archéologue', hint: 'Pousser la loupe assez fort pour lire un ancien texte du site.' },
  { id: 'double-loupe', label: 'Double exposition', hint: 'Croiser deux loupes.' },
  { id: 'cartographe', label: 'Cartographe', hint: 'Passer par toutes les pièces du niveau façon Doom.' },
];

export const ACHIEVEMENT_BY_ID: ReadonlyMap<string, AchievementDef> = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Pages projet à visiter pour « Explorateur ». */
export const EXPLORER_PAGES = 3;
