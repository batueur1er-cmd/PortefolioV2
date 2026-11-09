/** Un ancien texte du site, retrouvé dans l'historique git du dépôt. */
export interface Stratum {
  readonly text: string;
  /** La date du commit qui l'a remplacé ou retiré. */
  readonly until: string;
  readonly commit: string;
}

/** À partir de ce grossissement, la loupe descend d'une couche : le site tel qu'il était. */
export const HISTORY_ZOOM = 2.2;

/**
 * Par section (son `data-label`), un texte qui a vraiment été en ligne ou dans le dépôt. Rien n'est
 * réécrit : chaque ligne se retrouve avec `git show <commit>`. Une section sans ancien texte
 * n'apparaît pas ici, et la couche reste vide.
 */
export const HISTORY: ReadonlyMap<string, Stratum> = new Map([
  ['Accueil', { text: 'Ce site a une seconde face. Je ne parle pas du mode nuit.', until: '5 novembre 2026', commit: 'fa5b3c3' }],
  ['Parcours', { text: 'Développement informatique en alternance, en parallèle du Bachelor Coordinateur de projets informatiques.', until: '5 novembre 2026', commit: '5db778c' }],
  ['Réalisations', { text: 'Ce site : un portfolio Angular qui se lit à deux fenêtres. Rétrécissez-en une, posez-la sur l’autre : elle devient une loupe à rayons X.', until: '4 novembre 2026', commit: 'adae626' }],
  ['Formation', { text: 'Un bac orienté maths et informatique, un BTS SIO, puis un Bachelor de coordination de projets.', until: '5 novembre 2026', commit: '5db778c' }],
]);
