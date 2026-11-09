/** Adresse de la page : déclarée dans app.routes.ts, attendue par la loupe. */
export const MAKING_OF_PATH = '/colophon';

export interface Chapter {
  readonly title: string;
  readonly paragraphs: readonly string[];
}

/** Ce que racontent les rayons X : uniquement ce que fait le code de ce dépôt. */
export const CHAPTERS: readonly Chapter[] = [
  {
    title: 'Deux fenêtres, une seule page',
    paragraphs: [
      'La loupe n’est pas un effet posé sur la page : c’est une seconde fenêtre du même site. Rétrécie sous 680 × 620 pixels pendant qu’une grande fenêtre est ouverte, elle change de rôle toute seule et affiche la page aux rayons X.',
      'Toutes les fenêtres appliquent la même règle (decideRole), avec le même seuil (LENS_WINDOW). Aucun bouton ne l’ouvre : il faut la trouver.',
    ],
  },
  {
    title: 'Le bus entre les fenêtres',
    paragraphs: [
      'Les fenêtres se parlent par BroadcastChannel, sans aucun serveur. À chaque image, chacune publie sa présence : sa position à l’écran, sa taille, son défilement, le zoom du navigateur.',
      'Les événements ponctuels (secret trouvé, thème changé, succès) passent par un second canal de commandes.',
    ],
  },
  {
    title: 'Aligné au pixel près',
    paragraphs: [
      'La copie aux rayons X est décalée de l’écart entre les deux fenêtres, moins le défilement, le tout ramené au zoom de chaque navigateur : posée sur la page, la loupe a l’air transparente.',
      'Pour que cela tienne, les rayons X ne changent que les couleurs, les contours et les opacités, jamais la mise en page. Les tailles s’écrivent en cqi et en var(--vh), jamais en vw ou en vh, car la copie vit dans une fenêtre d’une autre taille.',
    ],
  },
  {
    title: 'Une copie qui ne décide de rien',
    paragraphs: [
      'Une scène 3D ne regarde jamais sa propre fenêtre. La démo façon Doom et le visualiseur publient leur état à chaque image, et la copie le redessine dans la même image que son déplacement.',
      'Rien n’y est aléatoire : le moteur suit une horloge de tics partagée, sinon les deux fenêtres verraient des images différentes.',
    ],
  },
  {
    title: 'Le rangement du code',
    paragraphs: [
      'Le code est rangé en cinq couches : core, domain, shared, features et shell. Un script (check-architecture) vérifie le sens des dépendances avant chaque lancement des tests.',
      'Angular 21 tourne sans zone.js : tout changement visible passe par un signal, et le travail à chaque image par une boucle unique (FrameLoop).',
    ],
  },
];
