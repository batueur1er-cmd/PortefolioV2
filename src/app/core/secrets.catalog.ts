import { PROFILE } from './profile.data';

export type SectionId =
  | 'accueil'
  | 'profil'
  | 'parcours'
  | 'realisations'
  | 'competences'
  | 'formation'
  | 'coulisses'
  | 'contact';

export interface SecretDef {
  readonly id: string;
  readonly label: string;
  readonly section: SectionId;
}

export const SECTION_ORDER: readonly SectionId[] = [
  'accueil',
  'profil',
  'parcours',
  'realisations',
  'competences',
  'formation',
  'coulisses',
  'contact',
];

export const SECTION_LABELS: Readonly<Record<SectionId, string>> = {
  accueil: 'Accueil',
  profil: 'Profil',
  parcours: 'Parcours',
  realisations: 'Réalisations',
  competences: 'Compétences',
  formation: 'Formation',
  coulisses: 'Sous le capot',
  contact: 'Contact',
};

/**
 * Tous les secrets du site. Chaque identifiant doit apparaître une fois, et une seule,
 * dans les gabarits via la directive `appSecret` (vérifié par portfolio-page.spec.ts).
 */
export const SECRETS: readonly SecretDef[] = [
  { id: 'nav-version', label: 'Le numéro de version', section: 'accueil' },
  { id: 'hero-measure', label: 'La mesure du titre en direct', section: 'accueil' },
  { id: 'hero-stamp', label: 'Le tampon « pas censé voir ça »', section: 'accueil' },
  { id: 'hero-twin', label: 'La page en deux exemplaires', section: 'accueil' },
  { id: 'about-summary', label: "Le résumé LinkedIn d'origine", section: 'profil' },
  { id: 'about-facts', label: 'Le calcul des mois sur le terrain', section: 'profil' },
  ...PROFILE.experiences.map((e) => ({ id: `exp-${e.id}`, label: e.secretLabel, section: 'parcours' as const })),
  { id: 'exp-map', label: 'La carte du parcours', section: 'parcours' },
  ...PROFILE.projects.map((p) => ({ id: `proj-${p.id}`, label: p.secretLabel, section: 'realisations' as const })),
  { id: 'skills-graph', label: 'Le graphe des compétences', section: 'competences' },
  { id: 'skills-linkedin', label: 'Le top 3 LinkedIn', section: 'competences' },
  { id: 'skills-pix', label: 'Le tampon PIX', section: 'competences' },
  { id: 'edu-chain', label: 'Le BTS et le Bachelor enchaînés', section: 'formation' },
  { id: 'edu-decoder', label: "Le décodeur d'acronymes", section: 'formation' },
  { id: 'edu-span', label: 'Les années de formation', section: 'formation' },
  { id: 'hood-diagram', label: 'Le schéma de synchronisation', section: 'coulisses' },
  { id: 'hood-code', label: 'La formule de la loupe', section: 'coulisses' },
  { id: 'hood-live', label: 'Les fenêtres connectées en direct', section: 'coulisses' },
  { id: 'contact-score', label: 'Le score à mentionner', section: 'contact' },
  { id: 'footer-made', label: 'La signature du site', section: 'contact' },
];

export const SECRET_IDS: ReadonlySet<string> = new Set(SECRETS.map((s) => s.id));
export const SECRET_BY_ID: ReadonlyMap<string, SecretDef> = new Map(SECRETS.map((s) => [s.id, s]));
